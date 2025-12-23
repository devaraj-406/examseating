import React, { useState, useEffect, useCallback } from 'react';
import { jsPDF } from "jspdf";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

function SeatingArrangement({ classrooms, students, onToggleClassroom }) {
  const [alert, setAlert] = useState('');
  const [selectedDate, setSelectedDate] = useState(localStorage.getItem('selectedDate') || '');
  const [selectedAssessment, setSelectedAssessment] = useState(localStorage.getItem('selectedAssessment') || '');
  const [arrangements, setArrangements] = useState([]);
  const [collegeName, setCollegeName] = useState('KNOWLEDGE INSTITUTE OF TECHNOLOGY, SALEM - 637 504.');
  const [institutionType, setInstitutionType] = useState('(An Autonomous Institution)');
  const [department, setDepartment] = useState('Department of Computer Science & Engineering');
  const [examType, setExamType] = useState('internal');
  const [collegeIcon, setCollegeIcon] = useState(null);

  const convertToRoman = (year) => {
    const romanNumerals = { '1st': 'I', '2nd': 'II', '3rd': 'III', '4th': 'IV' };
    return romanNumerals[year] || year;
  };

  const romanToInt = (roman) => {
    const romanValues = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4 };
    return romanValues[roman] || 0;
  };

  const getYearsInClassroom = (classroom) => {
    if (!classroom || !Array.isArray(classroom)) return '';
    const yearsAndDepts = new Set();
    classroom.forEach(row => {
      if (Array.isArray(row)) {
        row.forEach(seat => {
          if (seat && Array.isArray(seat) && seat.length > 0) {
            seat.forEach(student => {
              if (student && student.year && student.department) {
                yearsAndDepts.add(`${convertToRoman(student.year)} ${student.department}`);
              }
            });
          }
        });
      }
    });
    return Array.from(yearsAndDepts)
      .sort((a, b) => {
        const [yearA] = a.split(' ');
        const [yearB] = b.split(' ');
        return romanToInt(yearA) - romanToInt(yearB);
      })
      .join(', ');
  };

  const generateSeatingArrangement = useCallback(() => {
    let seating = [];
    let flattenedStudents = [];

    if (students && Array.isArray(students)) {
      students.forEach((student) => {
        if (student && student.startRegister && student.endRegister) {
          const start = parseInt(student.startRegister.replace(/^[A-Z]/, ''), 10);
          const end = parseInt(student.endRegister.replace(/^[A-Z]/, ''), 10);
          const prefix = student.startRegister.match(/^[A-Z]/) ? student.startRegister.match(/^[A-Z]/)[0] : '';
          for (let reg = start; reg <= end; reg++) {
            flattenedStudents.push({
              year: convertToRoman(student.year),
              register: `${prefix}${reg.toString().padStart(3, '0')}`,
              department: student.department
            });
          }
        }
      });
    }

    const enabledClassrooms = classrooms.filter(classroom => classroom && classroom.isEnabled);

    enabledClassrooms.forEach((classroom) => {
      if (!classroom) return;
      const { rows, columns, seatingType, hallNo } = classroom;
      let rowData = Array.from({ length: rows }, () => Array(columns).fill(null));
      let classroomStudentsSeated = 0;

      const effectiveSeatingType = examType === 'internal' ? seatingType : 'Single Seater';

      const isCompatibleSeat = (row, col, student) => {
        if (examType === 'internal') {
          if (effectiveSeatingType === 'Single Seater') {
            return true;
          } else if (effectiveSeatingType === 'Two Seater') {
            return !rowData[row][col] || 
                   (rowData[row][col].length < 2 && 
                    rowData[row][col].every(seatedStudent => seatedStudent.year !== student.year));
          }
        } else {
          const adjacentSeats = [
            [row, col - 1], [row, col + 1],
            [row - 1, col], [row + 1, col]
          ];
          return adjacentSeats.every(([r, c]) => 
            r < 0 || r >= rows || c < 0 || c >= columns || 
            !rowData[r][c] || 
            !rowData[r][c].some(seatedStudent => seatedStudent.department === student.department)
          );
        }
      };

      for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
          const currentRow = col % 2 === 0 ? row : rows - row - 1;

          if (!rowData[currentRow][col]) {
            rowData[currentRow][col] = [];
          }

          while (rowData[currentRow][col].length < (effectiveSeatingType === 'Two Seater' ? 2 : 1) && flattenedStudents.length > 0) {
            let studentIndex = -1;
            
            for (let i = 0; i < flattenedStudents.length; i++) {
              const student = flattenedStudents[i];
              if (isCompatibleSeat(currentRow, col, student)) {
                studentIndex = i;
                break;
              }
            }

            if (studentIndex === -1) break;

            const student = flattenedStudents[studentIndex];
            rowData[currentRow][col].push(student);
            flattenedStudents.splice(studentIndex, 1);
            classroomStudentsSeated++;
          }

          if (flattenedStudents.length === 0) break;
        }
        if (flattenedStudents.length === 0) break;
      }

      seating.push({ hallNo, arrangement: rowData, studentsSeated: classroomStudentsSeated });
    });

    if (flattenedStudents.length > 0) {
      setAlert(`Not enough seats in all classrooms for all students! ${flattenedStudents.length} students couldn't be seated.`);
    }

    setArrangements(seating);
  }, [classrooms, students, examType]);

  useEffect(() => {
    generateSeatingArrangement();
  }, [generateSeatingArrangement]);

  const generatePDF = (index) => {
    const { hallNo, arrangement } = arrangements[index];
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    if (collegeIcon) {
      pdf.addImage(collegeIcon, 'JPEG', 45, 8, 15, 15);
    }
    
    pdf.setFontSize(16);
    pdf.setFont(undefined, 'bold');
    pdf.text(collegeName, 150, 15, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(institutionType, 150, 22, { align: 'center' });
    pdf.text(department, 150, 38, { align: 'center' });
    pdf.text(selectedAssessment, 150, 45, { align: 'center' });
    pdf.text(`Hall No: ${hallNo}`, 150, 52, { align: 'center' });
    pdf.text(`(${getYearsInClassroom(arrangement)})`, 150, 59, { align: 'center' });
    pdf.setFontSize(10);
    pdf.text(`Date: ${selectedDate}`, 250, 66, { align: 'center' });
    
    let yOffset = 71;
    const cellWidth = 55;
    const cellHeight = 12;
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    arrangement[0].forEach((_, cellIndex) => {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(10 + cellIndex * cellWidth, yOffset, cellWidth, cellHeight, 'FD');
      pdf.text(`Column ${cellIndex + 1}`, 10 + cellIndex * cellWidth + cellWidth / 2, yOffset + 8, { align: 'center' });
    });
    yOffset += cellHeight;
    
    arrangement.forEach((row, rowIndex) => {
      row.forEach((cell, cellIndex) => {
        pdf.setFont(undefined, 'bold');
        pdf.setFillColor(255, 255, 255);
        pdf.rect(10 + cellIndex * cellWidth, yOffset, cellWidth, cellHeight, 'FD');
        if (cell && cell.length > 0) {
          pdf.setFontSize(9);
          pdf.text(cell.map(s => s.register).join(', '), 10 + cellIndex * cellWidth + cellWidth / 2, yOffset + 5, { align: 'center' });
          pdf.setFontSize(8);
          pdf.text(cell.map(s => `${s.year} ${s.department}`).join(', '), 10 + cellIndex * cellWidth + cellWidth / 2, yOffset + 9, { align: 'center' });
        }
      });
      yOffset += cellHeight;
    });
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('Exam Coordinator', 50, 188);
    pdf.text('HOD', 250, 188);
    
    pdf.save(`seating-arrangement-${hallNo}.pdf`);
  };

  const downloadAllPDFsAsZip = () => {
    const zip = new JSZip();
    
    const pdfPromises = arrangements.map(({ hallNo, arrangement }) => {
      return new Promise((resolve) => {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        if (collegeIcon) {
          pdf.addImage(collegeIcon, 'JPEG', 45, 8, 15, 15);
        }
        
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(collegeName, 150, 15, { align: 'center' });
        pdf.setFontSize(12);
        pdf.text(institutionType, 150, 22, { align: 'center' });
        pdf.text(department, 150, 38, { align: 'center' });
        pdf.text(selectedAssessment, 150, 45, { align: 'center' });
        pdf.text(`Hall No: ${hallNo}`, 150, 52, { align: 'center' });
        pdf.text(`(${getYearsInClassroom(arrangement)})`, 150, 59, { align: 'center' });
        pdf.setFontSize(10);
        pdf.text(`Date: ${selectedDate}`, 250, 66, { align: 'center' });
        
        let yOffset = 71;
        const cellWidth = 55;
        const cellHeight = 12;
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        arrangement[0].forEach((_, cellIndex) => {
          pdf.setFillColor(255, 255, 255);
          pdf.rect(10 + cellIndex * cellWidth, yOffset, cellWidth, cellHeight, 'FD');
          pdf.text(`Column ${cellIndex + 1}`, 10 + cellIndex * cellWidth + cellWidth / 2, yOffset + 8, { align: 'center' });
        });
        yOffset += cellHeight;
        
        arrangement.forEach((row, rowIndex) => {
          row.forEach((cell, cellIndex) => {
            pdf.setFont(undefined, 'bold');
            pdf.setFillColor(255, 255, 255);
            pdf.rect(10 + cellIndex * cellWidth, yOffset, cellWidth, cellHeight, 'FD');
            if (cell && cell.length > 0) {
              pdf.setFontSize(9);
              pdf.text(cell.map(s => s.register).join(', '), 10 + cellIndex * cellWidth + cellWidth / 2, yOffset + 5, { align: 'center' });
              pdf.setFontSize(8);
              pdf.text(cell.map(s => `${s.year} ${s.department}`).join(', '), 10 + cellIndex * cellWidth + cellWidth / 2, yOffset + 9, { align: 'center' });
            }
          });
          yOffset += cellHeight;
        });
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.text('Exam Coordinator', 50, 188);
        pdf.text('HOD', 250, 188);

        pdf.output('blob').then(blob => {
          zip.file(`seating-arrangement-${hallNo}.pdf`, blob);
          resolve();
        });
      });
    });

    Promise.all(pdfPromises).then(() => {
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, 'seating-arrangements.zip');
      });
    });
  };

  const handleIconUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCollegeIcon(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    localStorage.setItem('selectedDate', newDate);
  };

  const handleAssessmentChange = (e) => {
    const newAssessment = e.target.value;
    setSelectedAssessment(newAssessment);
    localStorage.setItem('selectedAssessment', newAssessment);
  };

  return (
    <div className="seating-arrangement" style={{ textAlign: 'center' }}>
 <div className="controls">
        <label>
          Date:
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
          />
        </label>
        <label>
          Assessment Type:
          <select
            value={selectedAssessment}
            onChange={handleAssessmentChange}
          >
            <option value="">Select Assessment Type</option>
            <option value="Internal Assessment Test - I">Internal Assessment Test - I</option>
            <option value="Internal Assessment Test - II">Internal Assessment Test - II</option>
            <option value="Internal Assessment Test - III">Internal Assessment Test - III</option>
          </select>
        </label>
        <label>
          Exam Type:
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
          >
            <option value="internal">Internal Exam</option>
            <option value="semester">End Semester Exam</option>
          </select>
        </label>
        <label>
          College Name:
          <input
            type="text"
            value={collegeName}
            onChange={(e) => setCollegeName(e.target.value)}
          />
        </label>
        <label>
          Institution Type:
          <input
            type="text"
            value={institutionType}
            onChange={(e) => setInstitutionType(e.target.value)}
          />
        </label>
        <label>
          Department:
          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </label>
        <label>
          College Icon:
          <input
            type="file"
            accept="image/*"
            onChange={handleIconUpload}
          />
        </label>
      </div>

      {arrangements.map(({ hallNo, arrangement }, cIndex) => (
        arrangement && (
          <div key={cIndex} className="classroom" style={{
            margin: '2rem auto',
            maxWidth: '1200px',
            padding: '2rem',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
            backgroundColor: '#fff'
          }}>
            <div className="header-template" style={{ 
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {collegeIcon && (
                <img 
                  src={collegeIcon} 
                  alt="College Icon" 
                  style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                />
              )}
              <div className="header-text" style={{ textAlign: 'center' }}>
                <h1 style={{ margin: '1rem 0', fontSize: '1.5rem', fontWeight: 'bold' }}>{collegeName}</h1>
                <h2 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>{institutionType}</h2>
                <h2 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>{department}</h2>
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem' }}>{selectedAssessment}</h3>
                <p style={{ margin: '0.5rem 0' }}>Hall No: {hallNo}</p>
                <p style={{ margin: '0.5rem 0' }}>({getYearsInClassroom(arrangement)})</p>
                <p className="date" style={{ margin: '0.5rem 0' }}>Date: {selectedDate}</p>
              </div>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#fff',
                margin: '0 auto'
              }}>
                <thead>
                  <tr>
                    {Array.from({ length: arrangement[0] ? arrangement[0].length : 0 }).map((_, i) => (
                      <th key={i} style={{
                        padding: '1rem',
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        fontWeight: 'bold'
                      }}>
                        Column {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {arrangement.map((row, rIndex) => (
                    <tr key={rIndex}>
                      {row.map((seat, sIndex) => (
                        <td key={sIndex} style={{
                          padding: '1rem',
                          border: '1px solid #ddd',
                          backgroundColor: '#fff',
                          textAlign: 'center'
                        }}>
                          {seat && seat.length > 0 ? (
                            <>
                              <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                {seat.map(student => student.register).join(', ')}
                              </div>
                              <div style={{ fontSize: '0.9em', color: '#666' }}>
                                {seat.map(student => `${student.year} ${student.department}`).join(', ')}
                              </div>
                            </>
                          ) : ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="footer" style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '2rem',
              borderTop: '1px solid #ddd',
              marginTop: '2rem'
            }}>
              <p style={{ fontWeight: 'bold' }}>Exam Coordinator</p>
              <p style={{ fontWeight: 'bold' }}>HOD</p>
            </div>

            <button 
              onClick={() => generatePDF(cIndex)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                margin: '1rem auto',
                display: 'block',
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
            >
              Download This Arrangement as PDF
            </button>
          </div>
        )
      ))}

      {arrangements.length > 0 && (
        <button 
          onClick={downloadAllPDFsAsZip}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            margin: '2rem auto',
            display: 'block',
            fontWeight: 'bold',
            transition: 'background-color 0.3s'
          }}
        >
          Download All PDFs as Zip
        </button>
      )}

      {alert && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          margin: '1rem auto',
          maxWidth: '600px',
          textAlign: 'center'
        }}>
          {alert}
        </div>
      )}
    </div>
  );
}

export default SeatingArrangement;

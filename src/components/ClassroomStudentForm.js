import React, { useState, useRef, useEffect } from 'react';
import '../Styles/ClassroomStudentForm.css';

const blocks = ['A', 'B', 'C', 'D'];
const classroomsPerBlock = {
  A: ['A313', 'A314', 'A302', 'A304', 'A310', 'A311', 'A303', 'A305', 'A306'],
  B: ['B395', 'B308', 'B309', 'B302', 'B208', 'B002', 'B306'],
  C: ['C201', 'C202', 'C203', 'C304', 'C305', 'C309', 'C108', 'C106', 'C125', 'C209', 'C004'],
  D: ['D209', 'D210', 'D203', 'D204', 'D205', 'D303', 'D302', 'D304', 'D305', 'D308', 'D010', 'D007']
};
const seatingTypes = ['Single Seater', 'Two Seater'];
const yearOptions = ['1st', '2nd', '3rd', '4th'];
const departmentOptions = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL'];

function ClassroomStudentForm({ classrooms, setClassrooms, students, setStudents }) {
  const [classroomForm, setClassroomForm] = useState({
    selectedBlock: '',
    selectedClassrooms: [],
    seatingType: 'Single Seater',
    showDetails: false,
    rows: 5,
    columns: 5,
  });
  const [selectedClassroomForEdit, setSelectedClassroomForEdit] = useState('');
  const [editingClassroom, setEditingClassroom] = useState(null);

  const [studentForm, setStudentForm] = useState({
    year: '1st',
    department: 'CSE',
    startRegister: '',
    endRegister: '',
    singleRegister: '',
    inputMode: 'range',
    deleteRegister: '',
  });
  const [selectedStudentListForEdit, setSelectedStudentListForEdit] = useState('');
  const [editingStudentList, setEditingStudentList] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedStudents = localStorage.getItem('students');
    const savedUploadedFiles = localStorage.getItem('uploadedFiles');

    if (savedStudents) setStudents(JSON.parse(savedStudents));
    if (savedUploadedFiles) setUploadedFiles(JSON.parse(savedUploadedFiles));
  }, [setStudents]);

  useEffect(() => {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('uploadedFiles', JSON.stringify(uploadedFiles));
  }, [students, uploadedFiles]);

  const showAlert = (message) => {
    alert(message);
  };


  const handleClassroomFormChange = (e) => {
    const { name, value } = e.target;
    setClassroomForm(prev => ({ ...prev, [name]: value }));
  };

  const handleClassroomToggle = (classroom) => {
    setClassroomForm(prev => ({
      ...prev,
      selectedClassrooms: prev.selectedClassrooms.includes(classroom)
        ? prev.selectedClassrooms.filter(c => c !== classroom)
        : [...prev.selectedClassrooms, classroom]
    }));
  };

  const addClassrooms = () => {
    if (classroomForm.selectedClassrooms.length === 0) {
      showAlert("Please select at least one classroom.");
      return;
    }

    const newClassrooms = classroomForm.selectedClassrooms
      .filter(classroom => !classrooms.some(c => c.hallNo === classroom))
      .map(classroom => ({
        hallNo: classroom,
        rows: classroomForm.rows,
        columns: classroomForm.columns,
        seatingType: classroomForm.seatingType,
        block: classroom[0],
        isEnabled: true,
      }));

    if (newClassrooms.length === 0) {
      showAlert("All selected classrooms already exist.");
      return;
    }

    setClassrooms(prev => [...prev, ...newClassrooms]);
    setClassroomForm(prev => ({ ...prev, selectedClassrooms: [] }));
    showAlert("Classrooms added successfully.");
  };

  const deleteClassroom = (hallNo) => {
    setClassrooms(prev => prev.filter(classroom => classroom.hallNo !== hallNo));
    setSelectedClassroomForEdit('');
    setEditingClassroom(null);
    showAlert("Classroom deleted successfully.");
  };

  const startEditingClassroom = (classroom) => {
    setEditingClassroom({ ...classroom });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingClassroom(prev => ({
      ...prev,
      [name]: name === 'rows' || name === 'columns' ? parseInt(value, 10) : value
    }));
  };

  const saveClassroomChanges = () => {
    if (classrooms.some(c => c.hallNo === editingClassroom.hallNo && c.hallNo !== selectedClassroomForEdit)) {
      showAlert("A classroom with this name already exists.");
      return;
    }

    setClassrooms(prev => prev.map(c => 
      c.hallNo === selectedClassroomForEdit ? editingClassroom : c
    ));
    setSelectedClassroomForEdit('');
    setEditingClassroom(null);
    showAlert("Classroom changes saved successfully.");
  };

  // Student functions
  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentForm(prev => ({ ...prev, [name]: value }));
  };

  const convertToRoman = (year) => {
    const romanNumerals = { '1st': 'I', '2nd': 'II', '3rd': 'III', '4th': 'IV' };
    return romanNumerals[year] || year;
  };

  const isValidRegisterNumber = (register) => {
    return /^[A-Z]?\d+$/.test(register);
  };

  const getNumericValue = (register) => {
    return parseInt(register.replace(/^[A-Z]/, ''), 10);
  };

  const consolidateRanges = (newStudents) => {
    return newStudents.reduce((acc, curr) => {
      if (acc.length === 0) return [curr];
      const last = acc[acc.length - 1];
      if (last.year === curr.year && last.department === curr.department &&
          getNumericValue(curr.startRegister) === getNumericValue(last.endRegister) + 1) {
        last.endRegister = curr.endRegister;
      } else {
        acc.push(curr);
      }
      return acc;
    }, []);
  };

  const addStudent = () => {
    const { inputMode, year, department, startRegister, endRegister, singleRegister } = studentForm;

    if (inputMode === 'range') {
      if (!isValidRegisterNumber(startRegister) || !isValidRegisterNumber(endRegister)) {
        showAlert("Register numbers should be digits only (e.g., 15) or one letter followed by digits (e.g., A15).");
        return;
      }

      const start = getNumericValue(startRegister);
      const end = getNumericValue(endRegister);

      if (start > end) {
        showAlert("Start register number should be less than or equal to end register number.");
        return;
      }

      const newStudent = { year: convertToRoman(year), department, startRegister, endRegister };
      setStudents(prev => consolidateRanges([...prev, newStudent]));
      setStudentForm(prev => ({ ...prev, startRegister: '', endRegister: '' }));
    } else {
      if (!isValidRegisterNumber(singleRegister)) {
        showAlert("Register number should be digits only (e.g., 15) or one letter followed by digits (e.g., A15).");
        return;
      }

      const newStudent = { year: convertToRoman(year), department, startRegister: singleRegister, endRegister: singleRegister };
      setStudents(prev => consolidateRanges([...prev, newStudent]));
      setStudentForm(prev => ({ ...prev, singleRegister: '' }));
    }

    setStudentForm(prev => ({ ...prev, year: '1st', department: 'CSE' }));
    showAlert("Student(s) added successfully.");
  };

  const deleteStudent = (index) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
    showAlert("Student deleted successfully.");
  };

  const deleteRegisterFromRange = (index) => {
    const { deleteRegister } = studentForm;
    if (!isValidRegisterNumber(deleteRegister)) {
      showAlert("Invalid register number format.");
      return;
    }

    const updatedStudents = [...students];
    const student = updatedStudents[index];
    const registerToDelete = getNumericValue(deleteRegister);
    const start = getNumericValue(student.startRegister);
    const end = getNumericValue(student.endRegister);

    if (registerToDelete < start || registerToDelete > end) {
      showAlert("Register number is not within the specified range.");
      return;
    }

    if (registerToDelete === start && registerToDelete === end) {
      updatedStudents.splice(index, 1);
    } else if (registerToDelete === start) {
      student.startRegister = (start + 1).toString().padStart(student.startRegister.length, '0');
    } else if (registerToDelete === end) {
      student.endRegister = (end - 1).toString().padStart(student.endRegister.length, '0');
    } else {
      const newStudent = {
        year: student.year,
        department: student.department,
        startRegister: (registerToDelete + 1).toString().padStart(student.startRegister.length, '0'),
        endRegister: student.endRegister
      };
      student.endRegister = (registerToDelete - 1).toString().padStart(student.endRegister.length, '0');
      updatedStudents.splice(index + 1, 0, newStudent);
    }

    setStudents(updatedStudents);
    setStudentForm(prev => ({ ...prev, deleteRegister: '' }));
    showAlert("Register number deleted successfully.");
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (uploadedFiles.includes(file.name)) {
      showAlert("This file has already been uploaded.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const lines = content.split('\n');
      const newStudents = lines
        .filter(line => line.trim() !== '')
        .map(line => {
          const [year, department, register] = line.split(',').map(item => item.trim().replace(/^"|"$/g, ''));
          if (!year || !department || !register) {
            console.warn(`Skipping invalid line: ${line}`);
            return null;
          }
          return { 
            year: convertToRoman(year), 
            department, 
            startRegister: register, 
            endRegister: register 
          };
        })
        .filter(student => student !== null);

      if (newStudents.length === 0) {
        showAlert("No valid student data found in the uploaded file.");
        return;
      }

      setStudents(prev => consolidateRanges([...prev, ...newStudents]));
      setUploadedFiles(prev => [...prev, file.name]);
      showAlert("Student data uploaded successfully.");
    };
    reader.readAsText(file);
  };

  const deleteStudentList = (fileName) => {
    setStudents(prev => prev.filter(student => !uploadedFiles.includes(fileName)));
    setUploadedFiles(prev => prev.filter(file => file !== fileName));
    setSelectedStudentListForEdit('');
    setEditingStudentList(null);
    showAlert("Student list deleted successfully.");
  };

  return (
    <div className="classroom-student-form">
      <h2>Classroom and Student Management</h2>
      
      {/* Classroom Form */}
      <div className="form-section">
        <h3>Add Classrooms</h3>
        <div className="form-controls">
          <select
            name="seatingType"
            value={classroomForm.seatingType}
            onChange={handleClassroomFormChange}
            className="form-select"
          >
            {seatingTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button onClick={() => setClassroomForm(prev => ({ ...prev, showDetails: !prev.showDetails }))} className="form-button">
            {classroomForm.showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        {classroomForm.showDetails && (
          <div className="form-controls">
            <input
              type="number"
              name="rows"
              value={classroomForm.rows}
              onChange={handleClassroomFormChange}
              placeholder="Rows"
              className="form-input"
            />
            <input
              type="number"
              name="columns"
              value={classroomForm.columns}
              onChange={handleClassroomFormChange}
              placeholder="Columns"
              className="form-input"
            />
          </div>
        )}
        <div className="classroom-selection">
          <select
            name="selectedBlock"
            value={classroomForm.selectedBlock}
            onChange={handleClassroomFormChange}
            className="form-select"
          >
            <option value="">Select Block</option>
            {blocks.map(block => (
              <option key={block} value={block}>Block {block}</option>
            ))}
          </select>
          {classroomForm.selectedBlock && classroomsPerBlock[classroomForm.selectedBlock] && (
            <div className="classroom-list">
              {classroomsPerBlock[classroomForm.selectedBlock].map(classroom => (
                <div 
                  key={classroom} 
                  className={`classroom-item ${classroomForm.selectedClassrooms.includes(classroom) ? 'selected' : ''}`}
                  onClick={() => handleClassroomToggle(classroom)}
                >
                  {classroom}
                  {classroomForm.selectedClassrooms.includes(classroom) && <span className="checkmark">✓</span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={addClassrooms} className="form-button">Add Selected Classrooms</button>
        </div>

     
      <div className="list-section">
        <h3>Classroom List</h3>
        <select
          value={selectedClassroomForEdit}
          onChange={(e) => {
            setSelectedClassroomForEdit(e.target.value);
            const classroom = classrooms.find(c => c.hallNo === e.target.value);
            if (classroom) {
              startEditingClassroom(classroom);
            }
          }}
          className="form-select"
        >
          <option value="">Select a classroom to edit</option>
          {classrooms.map((classroom) => (
            <option key={classroom.hallNo} value={classroom.hallNo}>
              {classroom.hallNo} - {classroom.seatingType} - {classroom.rows}x{classroom.columns}
            </option>
          ))}
        </select>
        {editingClassroom && (
          <div className="edit-classroom-form">
            <input
              type="text"
              name="hallNo"
              value={editingClassroom.hallNo}
              onChange={handleEditChange}
              placeholder="Classroom Name"
              className="form-input"
            />
            <input
              type="number"
              name="rows"
              value={editingClassroom.rows}
              onChange={handleEditChange}
              placeholder="Rows"
              className="form-input"
            />
            <input
              type="number"
              name="columns"
              value={editingClassroom.columns}
              onChange={handleEditChange}
              placeholder="Columns"
              className="form-input"
            />
            <select
              name="seatingType"
              value={editingClassroom.seatingType}
              onChange={handleEditChange}
              className="form-select"
            >
              {seatingTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <button onClick={saveClassroomChanges} className="form-button">Save Changes</button>
          </div>
        )}
        {selectedClassroomForEdit && (
          <button 
            onClick={() => deleteClassroom(selectedClassroomForEdit)}
            className="action-button delete"
          >
            Delete Selected Classroom
          </button>
        )}
      </div>

   
      <div className="form-section">
        <h3>Add Student</h3>
        <div className="form-controls">
          <select 
            name="year"
            value={studentForm.year} 
            onChange={handleStudentFormChange}
            className="form-select"
          >
            {yearOptions.map(option => (
              <option key={option} value={option}>{option} Year</option>
            ))}
          </select>

          <select
            name="department"
            value={studentForm.department}
            onChange={handleStudentFormChange}
            className="form-select"
          >
            {departmentOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>

          <select
            name="inputMode"
            value={studentForm.inputMode}
            onChange={handleStudentFormChange}
            className="form-select"
          >
            <option value="range">Range</option>
            <option value="single">Single</option>
          </select>

          {studentForm.inputMode === 'range' ? (
            <>
              <input
                type="text"
                name="startRegister"
                value={studentForm.startRegister}
                onChange={handleStudentFormChange}
                placeholder="Start Register Number (e.g., A15 or 15)"
                className="form-input"
              />
              <input
                type="text"
                name="endRegister"
                value={studentForm.endRegister}
                onChange={handleStudentFormChange}
                placeholder="End Register Number (e.g., A20 or 20)"
                className="form-input"
              />
            </>
          ) : (
            <input
              type="text"
              name="singleRegister"
              value={studentForm.singleRegister}
              onChange={handleStudentFormChange}
              placeholder="Single Register Number (e.g., A15 or 15)"
              className="form-input"
            />
          )}
          <button onClick={addStudent} className="form-button">Add Student</button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".csv,.txt"
          />
          <button onClick={() => fileInputRef.current.click()} className="form-button upload-button">
            Upload Student Details
          </button>
        </div>
      </div>

    
      <div className="list-section">
        <h3>Student Lists</h3>
        <select
          value={selectedStudentListForEdit}
          onChange={(e) => {
            setSelectedStudentListForEdit(e.target.value);
            const studentList = students.filter(student => 
              uploadedFiles.includes(e.target.value)
            );
            if (studentList.length > 0) {
              setEditingStudentList(studentList);
            }
          }}
          className="form-select"
        >
          <option value="">Select a student list to edit</option>
          {uploadedFiles.map((fileName) => (
            <option key={fileName} value={fileName}>
              {fileName}
            </option>
          ))}
        </select>
        {editingStudentList && (
          <div className="edit-student-list-form">
            <ul className="item-list">
              {editingStudentList.map((student, index) => (
                <li key={index} className="item">
                  <span>{student.year} - {student.department} - {student.startRegister}{student.startRegister !== student.endRegister ? ` to ${student.endRegister}` : ''}</span>
                  <div className="item-actions">
                    <input
                      type="text"
                      name="deleteRegister"
                      value={studentForm.deleteRegister}
                      onChange={handleStudentFormChange}
                      placeholder="Delete Register"
                      className="form-input delete-input"
                    />
                    <button onClick={() => deleteRegisterFromRange(students.findIndex(s => s === student))} className="action-button delete-register">Delete</button>
                    <button onClick={() => {
                      const updatedList = editingStudentList.filter((_, i) => i !== index);
                      setEditingStudentList(updatedList);
                    }} className="action-button delete">×</button>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => {
              setStudents(prev => {
                const filteredPrev = prev.filter(student => 
                  !uploadedFiles.includes(selectedStudentListForEdit)
                );
                return [...filteredPrev, ...editingStudentList];
              });
              setEditingStudentList(null);
              showAlert("Changes saved successfully.");
            }} className="form-button">Save Changes</button>
          </div>
        )}
        {selectedStudentListForEdit && (
          <button 
            onClick={() => deleteStudentList(selectedStudentListForEdit)}
            className="action-button delete"
          >
            Delete Selected Student List
          </button>
        )}
      </div>
    </div>
  );
}

export default ClassroomStudentForm;
import React from 'react';
import { BrowserRouter as Router, Route, Link, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Home from './components/Home';
import ClassroomStudentForm from './components/ClassroomStudentForm';
import SeatingArrangement from './components/SeatingArrangement';
import './App.css';

function App() {
  const [classrooms, setClassrooms] = React.useState([]);
  const [students, setStudents] = React.useState([]);
  const [hallNumber] = React.useState(''); // Removed unused setHallNumber

  return (
    <Router>
      <div className="App">
        <Helmet>
          <title>Seating Arrangement System</title>
        </Helmet>

        <nav className="navbar">
          <div className="container">
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/management">Classroom & Student Management</Link></li>
              <li><Link to="/seating">Seating Arrangement</Link></li>
            </ul>
          </div>
        </nav>

        <div className="container main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/management" 
              element={
                <ClassroomStudentForm 
                  classrooms={classrooms} 
                  setClassrooms={setClassrooms}
                  students={students}
                  setStudents={setStudents}
                />
              } 
            />
            <Route 
              path="/seating" 
              element={
                <SeatingArrangement 
                  classrooms={classrooms} 
                  students={students} 
                  hallNumber={hallNumber}
                />
              } 
            />
          </Routes>
        </div>

        <footer className="branding-footer">
          <div className="container">
            <p>POWERED BY NEXUS ZENIX</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;

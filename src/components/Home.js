import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="home-section">
      <h1>Welcome to the Seating Arrangement System</h1>
      <p>Efficiently manage classrooms, students, and create seating arrangements for exams.</p>
      <div className="cta-buttons">
        <Link to="/management" className="cta-button">Manage Classrooms & Students</Link>
        <Link to="/seating" className="cta-button">Create Seating Arrangement</Link>
      </div>
      <div className="features">
        <div className="feature-item">
          <h3>Classroom Management</h3>
          <p>Add and edit classroom details, including capacity and seating type.</p>
        </div>
        <div className="feature-item">
          <h3>Student Management</h3>
          <p>Manage student information and import student lists easily.</p>
        </div>
        <div className="feature-item">
          <h3>Seating Arrangements</h3>
          <p>Generate and customize seating arrangements for exams.</p>
        </div>
      </div>
    </section>
  );
}

export default Home;
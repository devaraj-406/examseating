import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

function Layout() {
  const [isNavVisible, setIsNavVisible] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let lastScrollTop = 0;
    const handleScroll = () => {
      const st = window.pageYOffset || document.documentElement.scrollTop;
      if (st > lastScrollTop) {
        setIsNavVisible(false);
      } else {
        setIsNavVisible(true);
      }
      lastScrollTop = st <= 0 ? 0 : st;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <nav className={`navbar ${isNavVisible ? 'visible' : 'hidden'}`}>
        <div className="container">
          <ul>
            <li>
              <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
            </li>
            <li>
              <Link to="/management" className={location.pathname === '/management' ? 'active' : ''}>Classroom & Student Management</Link>
            </li>
            <li>
              <Link to="/seating" className={location.pathname === '/seating' ? 'active' : ''}>Seating Arrangement</Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="container main-content">
        <Outlet />
      </div>

      <footer className="branding-footer">
        <div className="container">
          <p>POWERED BY NEXUS ZENIX</p>
        </div>
      </footer>
    </>
  );
}

export default Layout;
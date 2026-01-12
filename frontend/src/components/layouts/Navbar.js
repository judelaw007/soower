import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationsAPI } from '../../services/api';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-brand">
          <svg className="brand-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4L34 12V16L20 24L6 16V12L20 4Z" fill="#F5B800" stroke="#F5B800" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M20 16L34 24V28L20 36L6 28V24L20 16Z" fill="#F5B800" stroke="#F5B800" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M20 8L28 13V15L20 20L12 15V13L20 8Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
            <path d="M20 20L28 25V27L20 32L12 27V25L20 20Z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
          </svg>
          <span className="brand-text">SOOWER</span>
        </Link>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <Link to="/projects" className="nav-link">Projects</Link>

            {user ? (
              <>
                <Link to={isAdmin ? '/admin' : '/dashboard'} className="nav-link">
                  Dashboard
                </Link>
                <Link to="/notifications" className="nav-link notification-link">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </Link>
                <div className="user-menu">
                  <span className="user-name">{user.firstName}</span>
                  <button onClick={handleLogout} className="btn btn-outline btn-sm">
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

import React from 'react';
import { CalendarDays, Layers, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css'; // Let's also create this CSS file later

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="logo-container">
          <Layers size={22} className="logo-icon" />
        </div>
        <div className="title-wrapper">
          <h1 className="header-title">Attendance Dashboard</h1>
          <p className="header-subtitle">Overview &gt; Daily Logs</p>
        </div>
      </div>
      <div className="header-actions">
        <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="btn-icon">
          <CalendarDays size={18} />
          <span>Agenda</span>
        </button>
        <button className="btn-icon logout" onClick={handleLogout} style={{ color: '#ef4444' }}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;

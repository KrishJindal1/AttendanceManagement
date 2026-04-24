import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import '../styles/Login.css';
import { GraduationCap, BookOpen, KeyRound, User, Users, FileSpreadsheet, PieChart, ShieldCheck } from 'lucide-react';

const Login: React.FC = () => {
  const [role, setRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'TEACHER') navigate('/teacher/dashboard');
        else if (user.role === 'STUDENT') navigate('/student/dashboard');
      } catch {
        // invalid JSON, ignore
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiService.login({ username, password, role });
      
      if (response.success) {
        localStorage.setItem('user', JSON.stringify(response));
        if (role === 'TEACHER') {
          navigate('/teacher/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-split-container">
      {/* LEFT SIDE - Info / Landing Page content */}
      <div className="login-left">
        <div className="login-left-content">
          <div className="brand-logo">
            <GraduationCap size={56} color="#ffffff" strokeWidth={1.5} />
          </div>
          <h1 className="brand-title">Attendance System</h1>
          <p className="brand-subtitle">
            The simplest way to manage, track, and analyze classroom attendance.
          </p>
          
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-icon"><FileSpreadsheet size={24} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h3>One-Click Uploads</h3>
                <p>Import your Excel attendance sheets instantly without manual data entry.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon"><PieChart size={24} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h3>Smart Analytics</h3>
                <p>Automatically calculate attendance percentages and track student trends.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={24} strokeWidth={1.5} /></div>
              <div className="feature-text">
                <h3>Role-Based Access</h3>
                <p>Dedicated portals for teachers to manage data and students to view progress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="login-right">
        <div className="login-card animate-fade-in">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <div className="role-selector">
            <button 
              type="button"
              className={`role-btn ${role === 'TEACHER' ? 'active' : ''}`}
              onClick={() => setRole('TEACHER')}
            >
              <BookOpen size={18} />
              Teacher
            </button>
            <button 
              type="button"
              className={`role-btn ${role === 'STUDENT' ? 'active' : ''}`}
              onClick={() => setRole('STUDENT')}
            >
              <Users size={18} />
              Student
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label htmlFor="username">
                {role === 'TEACHER' ? 'Username' : 'Roll Number'}
              </label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={role === 'TEACHER' ? 'Enter username' : 'Enter roll number'}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <KeyRound className="input-icon" size={18} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
            
            {role === 'STUDENT' && (
              <p className="login-hint">Default student password is <strong>123456</strong></p>
            )}
            {role === 'TEACHER' && (
              <p className="login-hint">Default teacher credentials are <strong>admin / admin</strong></p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

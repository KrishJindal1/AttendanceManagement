import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService, type Student } from '../services/api';
import '../styles/StudentDashboard.css';
import { LogOut, CalendarDays, User, BookOpen, CheckCircle, XCircle } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          navigate('/login');
          return;
        }

        const user = JSON.parse(userStr);
        if (user.role !== 'STUDENT') {
          navigate('/login');
          return;
        }

        const data = await apiService.getStudentById(user.id);
        setStudent(data);
      } catch (err: unknown) {
        const error = err as Error;
        setError(error.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return <div className="student-loading">Loading your dashboard...</div>;
  }

  if (error || !student) {
    return (
      <div className="student-error">
        <p>{error || 'Student not found'}</p>
        <button onClick={handleLogout}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <header className="student-header">
        <div className="student-header-content">
          <h1>Student Portal</h1>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <main className="student-main">
        <div className="student-profile-card">
          <div className="profile-avatar">
            <User size={48} color="#4f46e5" />
          </div>
          <div className="profile-info">
            <h2>{student.name}</h2>
            <div className="profile-details">
              <span className="detail-badge">
                <BookOpen size={14} />
                {student.className}
              </span>
              <span className="detail-badge">
                Roll No: {student.rollNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="attendance-stats">
          <div className="stat-card total">
            <div className="stat-icon">
              <CalendarDays size={24} />
            </div>
            <div className="stat-content">
              <h3>{student.totalDays}</h3>
              <p>Total Classes</p>
            </div>
          </div>
          <div className="stat-card present">
            <div className="stat-icon">
              <CheckCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{student.presentDays}</h3>
              <p>Days Present</p>
            </div>
          </div>
          <div className="stat-card absent">
            <div className="stat-icon">
              <XCircle size={24} />
            </div>
            <div className="stat-content">
              <h3>{student.absentDays}</h3>
              <p>Days Absent</p>
            </div>
          </div>
          <div className="stat-card percentage">
            <div className="stat-content">
              <h3 className={student.attendancePercentage >= 75 ? 'good' : 'warning'}>
                {student.attendancePercentage}%
              </h3>
              <p>Overall Attendance</p>
            </div>
          </div>
        </div>

        <div className="attendance-history">
          <h3>Recent Attendance History</h3>
          {student.attendanceRecords && Object.keys(student.attendanceRecords).length > 0 ? (
            <div className="history-list">
              {Object.entries(student.attendanceRecords)
                .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                .map(([date, status]) => (
                  <div key={date} className={`history-item ${status.toLowerCase()}`}>
                    <span className="history-date">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span className="history-status">
                      {status === 'Present' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                      {status}
                    </span>
                  </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <p>No daily attendance records available yet.</p>
              <p className="no-history-sub">Your attendance is summarized above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

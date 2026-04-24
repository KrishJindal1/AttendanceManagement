import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FullUploadHistoryPage from './components/FullUploadHistoryPage';
import StudentDashboard from './components/StudentDashboard';
import LandingPage from './components/LandingPage';

const ProtectedTeacherRoute = ({ children }: { children: React.ReactNode }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" />;
  
  let user = null;
  try {
    user = JSON.parse(userStr);
  } catch {
    return <Navigate to="/login" />;
  }

  if (!user || user.role !== 'TEACHER') {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const TeacherApp = () => {
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'history'>('dashboard');

  return currentPage === 'dashboard' ? (
    <Dashboard onViewHistory={() => setCurrentPage('history')} />
  ) : (
    <FullUploadHistoryPage onBack={() => setCurrentPage('dashboard')} />
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/teacher/dashboard" 
          element={
            <ProtectedTeacherRoute>
              <TeacherApp />
            </ProtectedTeacherRoute>
          } 
        />
        
        <Route 
          path="/student/dashboard" 
          element={<StudentDashboard />} 
        />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

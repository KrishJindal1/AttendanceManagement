import React, { useState } from 'react';
import Header from './Header';
import FileUploader from './FileUploader';
import PdfExportPanel from './PdfExportPanel';
import StudentList from './StudentList';
import UploadHistory from './UploadHistory';
import CalendarWidget from './CalendarWidget';
import '../styles/Dashboard.css';

interface DashboardProps {
  onViewHistory?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewHistory }) => {
  // We can use a simple key change to force re-render/re-fetch of child components
  // when an upload succeeds. In a larger app, React Query or Redux would be better.
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="dashboard-layout">
      <Header />
      
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <CalendarWidget selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          <FileUploader onUploadSuccess={handleUploadSuccess} />
          <PdfExportPanel />
          <UploadHistory key={`history-${refreshKey}`} onViewAll={onViewHistory} />
        </aside>
        
        <main className="dashboard-main">
          <StudentList key={`students-${refreshKey}`} selectedDate={selectedDate} />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

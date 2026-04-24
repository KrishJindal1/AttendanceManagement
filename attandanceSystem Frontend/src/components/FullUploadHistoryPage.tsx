import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, FileText, Download } from 'lucide-react';
import { apiService, parseUploadDate, type UploadHistory as HistoryEntity } from '../services/api';
import Header from './Header';
import '../styles/FullUploadHistoryPage.css';
import '../styles/StudentList.css'; // For the table styles
import '../styles/Dashboard.css';

interface FullUploadHistoryPageProps {
  onBack: () => void;
}

const FullUploadHistoryPage: React.FC<FullUploadHistoryPageProps> = ({ onBack }) => {
  const [history, setHistory] = useState<HistoryEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getHistory();
      setHistory(data.sort((a,b) => parseUploadDate(b.uploadDate).getTime() - parseUploadDate(a.uploadDate).getTime()));
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Header />
      
      <main style={{ padding: '0 24px', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <div className="full-history-container glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="full-history-header">
            <button className="btn-secondary" onClick={onBack}>
              <ArrowLeft size={18} /> Back to Dashboard
            </button>
            <h2>All Upload History</h2>
          </div>
          
          {isLoading && (
            <div className="loading-state">
              <div className="spinner-lg"></div>
              <p>Loading history records...</p>
            </div>
          )}
          
          {error && !isLoading && (
            <div className="error-state">
              <p>{error}</p>
              <button className="btn-secondary" onClick={fetchHistory}>Retry</button>
            </div>
          )}
          
          {!isLoading && !error && history.length === 0 && (
            <div className="empty-state">
              <p>No upload history found.</p>
            </div>
          )}
          
          {!isLoading && !error && history.length > 0 && (
            <div className="table-responsive">
              <table className="student-table">
                <thead>
                  <tr>
                      <th>File ID / Name</th>
                      <th>Time of Upload</th>
                      <th>Status</th>
                      <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                    {history.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>
                          <FileText size={16} className="inline-icon"/> 
                          <span className="font-semibold">{item.fileName || 'Unknown File'}</span>
                        </td>
                        <td>
                          <Clock size={14} className="inline-icon" />
                          {parseUploadDate(item.uploadDate).toLocaleString()}
                        </td>
                        <td>
                          <span className={`status-badge ${item.status.toLowerCase()}`}>
                            {item.status}
                          </span>
                        </td>
                        <td>
                           <a 
                             href={apiService.getFileDownloadUrl(item.id)} 
                             className="btn-secondary btn-sm"
                             target="_blank"
                             rel="noopener noreferrer"
                             download
                           >
                              <Download size={14} /> Download
                           </a>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default FullUploadHistoryPage;

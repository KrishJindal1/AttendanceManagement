import React, { useEffect, useState } from 'react';
import { History, Clock, FileText, ExternalLink } from 'lucide-react';
import { apiService, parseUploadDate, type UploadHistory as HistoryEntity } from '../services/api';
import '../styles/UploadHistory.css';

interface UploadHistoryProps {
  onViewAll?: () => void;
}

const UploadHistory: React.FC<UploadHistoryProps> = ({ onViewAll }) => {
  const [history, setHistory] = useState<HistoryEntity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getHistory();
      setHistory(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="history-container glass-panel animate-fade-in" style={{ animationDelay: '0.2s' }}>
      <div className="list-header">
        <div className="list-title">
          <History size={24} className="text-accent" />
          <h2>Recent Uploads</h2>
        </div>
        <button className="btn-secondary btn-sm" onClick={fetchHistory}>Refresh</button>
      </div>

      {isLoading && (
         <div className="loading-state">
           <div className="spinner-lg"></div>
         </div>
      )}

      {error && !isLoading && (
        <div className="error-state">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && history.length === 0 && (
        <div className="empty-state">
          <p>No past uploads found.</p>
        </div>
      )}

      <div className="timeline">
        {[...history]
          .sort((a, b) => parseUploadDate(b.uploadDate).getTime() - parseUploadDate(a.uploadDate).getTime())
          .slice(0, 5)
          .map((item, idx) => (
          <div key={item.id || idx} className="timeline-item">
            <div className="timeline-icon">
              <FileText size={16} />
            </div>
            <div className="timeline-content">
              <h4 className="timeline-title">{item.fileName}</h4>
              <div className="timeline-meta">
                <span className="timeline-time">
                  <Clock size={14} />
                  {parseUploadDate(item.uploadDate).toLocaleString()}
                </span>
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {history.length > 5 && onViewAll && (
        <div className="view-all-container">
          <button className="btn-secondary btn-full-width" onClick={onViewAll}>
            View All History <ExternalLink size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadHistory;

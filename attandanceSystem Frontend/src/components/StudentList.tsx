import React, { useEffect, useState, useMemo } from 'react';
import { Users, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { apiService, type Student } from '../services/api';
import { isAbsentStatus } from '../utils/attendanceStatus';
import '../styles/StudentList.css';

interface StudentListProps {
  selectedDate?: string | null;
}

const StudentList: React.FC<StudentListProps> = ({ selectedDate }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'under75' | 'under70'>('all');

  const fetchStudents = async (dateParam: string | null | undefined) => {
    setIsLoading(true);
    setError('');
    try {
      const data = await apiService.getStudents(dateParam ?? null);
      setStudents(data);

      // Auto-expand all classes initially
      const initialExpanded: Record<string, boolean> = {};
      const uniqueClasses = Array.from(new Set(data.map(s => s.className)));
      uniqueClasses.forEach(cName => {
        initialExpanded[cName] = true;
      });
      setExpandedClasses(initialExpanded);

    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to load students.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchStudents(selectedDate);
  }, [selectedDate]);

  const toggleClass = (className: string) => {
    setExpandedClasses(prev => ({
      ...prev,
      [className]: !prev[className]
    }));
  };

  // Group and filter students
  const groupedStudents = useMemo(() => {
    const filtered = students.filter(s => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.className.toLowerCase().includes(searchQuery.toLowerCase());

      let matchFilter = true;
      if (filterMode === 'under75') {
        matchFilter = s.attendancePercentage < 75;
      } else if (filterMode === 'under70') {
        matchFilter = s.attendancePercentage < 70;
      }

      return matchSearch && matchFilter;
    });

    const groups: Record<string, Student[]> = {};
    filtered.forEach(student => {
      const cName = student.className || 'Unknown Class';
      if (!groups[cName]) groups[cName] = [];
      groups[cName].push(student);
    });

    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key].sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
      return acc;
    }, {} as Record<string, Student[]>);
  }, [students, searchQuery, filterMode]);

  const hasDataForSelectedDate = useMemo(() => {
    if (!selectedDate) return true;
    return students.some(s => selectedDate in s.attendanceRecords);
  }, [students, selectedDate]);

  return (
    <div className="student-list-container glass-panel animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <div className="list-header">
        <div className="list-title">
          <Users size={24} className="text-accent" />
          <h2>
            Student Records
            {selectedDate && <span className="date-badge">({selectedDate})</span>}
          </h2>
        </div>

        <div className="list-controls">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-chips">
            <button
              className={`chip ${filterMode === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMode('all')}
            >All</button>
            <button
              className={`chip warning ${filterMode === 'under75' ? 'active' : ''}`}
              onClick={() => setFilterMode('under75')}
            >&lt; 75%</button>
            <button
              className={`chip danger ${filterMode === 'under70' ? 'active' : ''}`}
              onClick={() => setFilterMode('under70')}
            >&lt; 70%</button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="loading-state">
          <div className="spinner-lg"></div>
          <p>Loading records...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn-secondary" onClick={() => fetchStudents(selectedDate)}>Retry</button>
        </div>
      )}

      {selectedDate && !hasDataForSelectedDate && !isLoading && !error && (
        <div className="empty-state">
          <p>No data found for this date.</p>
        </div>
      )}

      {!isLoading && !error && Object.keys(groupedStudents).length === 0 && hasDataForSelectedDate && (
        <div className="empty-state">
          <p>No student records found matching your search.</p>
        </div>
      )}

      {(!selectedDate || hasDataForSelectedDate) && (
        <div className="accordion-container">
          {Object.entries(groupedStudents).map(([className, classStudents]) => (
            <div key={className} className={`accordion-group ${expandedClasses[className] ? 'expanded' : ''}`}>
              <button
                className="accordion-header"
                onClick={() => toggleClass(className)}
                aria-expanded={expandedClasses[className]}
              >
                <div className="accordion-title">
                  {expandedClasses[className] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <h3>Class {className}</h3>
                </div>
                <span className="student-count badge">{classStudents.length} Students</span>
              </button>

              <div className="accordion-content">
                <div className="table-responsive">
                  <table className="student-table">
                    <thead>
                      <tr>
                        <th>Roll Number</th>
                        <th>Name</th>
                        <th>Class</th>
                        {selectedDate && <th>Daily Status</th>}
                        <th>Total Present</th>
                        <th>{selectedDate ? 'Total Absent' : 'Total Absent (%)'}</th>
                        <th>Overall Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classStudents.map((student, idx) => {
                        const dailyStatus = selectedDate ? student.attendanceRecords[selectedDate] : null;

                        return (
                          <tr key={student.id || idx}>
                            <td className="font-mono">{student.rollNumber}</td>
                            <td className="font-semibold">{student.name}</td>
                            <td>{student.className}</td>

                            {selectedDate && (
                              <td>
                                {dailyStatus !== null && dailyStatus !== undefined ? (
                                  <span className={`status-badge ${isAbsentStatus(dailyStatus) ? 'absent' : 'present'}`}>
                                    {isAbsentStatus(dailyStatus) ? 'Absent' : 'Present'}
                                  </span>
                                ) : (
                                  <span className="text-muted">-</span>
                                )}
                              </td>
                            )}

                            <td>
                              {student.presentDays}
                              <span className="text-muted"> / {student.totalDays}</span>
                            </td>
                            <td className="text-error">
                              {student.absentDays}
                              {!selectedDate && student.totalDays > 0 && (
                                <span className="text-muted">
                                  {' '}
                                  ({Math.round((student.absentDays / student.totalDays) * 100)}%)
                                </span>
                              )}
                            </td>
                            <td>
                              <div className="percentage-cell">
                                <span className={`status-badge ${student.attendancePercentage >= 75 ? 'present' :
                                    student.attendancePercentage >= 70 ? 'warning' : 'absent'
                                  }`}>
                                  {student.attendancePercentage}%
                                </span>
                                <div className="progress-bar-bg">
                                  <div
                                    className={`progress-bar-fill ${student.attendancePercentage >= 75 ? 'success' :
                                        student.attendancePercentage >= 70 ? 'warning' : 'danger'
                                      }`}
                                    style={{ width: `${Math.min(student.attendancePercentage, 100)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentList;

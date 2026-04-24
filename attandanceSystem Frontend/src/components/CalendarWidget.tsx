import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import '../styles/CalendarWidget.css';

interface CalendarWidgetProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  // activeDates?: string[]; // Could be used to highlight dates that have data
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedDate, onSelectDate }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleDateClick = (dayStr: string) => {
    if (selectedDate === dayStr) {
      onSelectDate(null); // toggle off
    } else {
      onSelectDate(dayStr);
    }
  };

  const renderDays = () => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');

    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Actual days
    for (let d = 1; d <= daysInMonth; d++) {
      const dayPad = String(d).padStart(2, '0');
      const dateString = `${year}-${month}-${dayPad}`;
      const isSelected = selectedDate === dateString;
      
      const isToday = new Date().toISOString().split('T')[0] === dateString;

      days.push(
        <button
          key={d}
          className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
          onClick={() => handleDateClick(dateString)}
        >
          {d}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="calendar-widget glass-panel animate-fade-in" style={{ animationDelay: '0.15s' }}>
      <div className="calendar-header-main">
        <div className="calendar-title">
          <CalendarIcon size={20} className="text-accent" />
          <h3>Attendance Date</h3>
        </div>
        {selectedDate && (
           <button className="btn-clear-date" onClick={() => onSelectDate(null)}>
             Clear Filter
           </button>
        )}
      </div>

      <div className="calendar-nav">
        <button className="btn-nav" onClick={prevMonth}><ChevronLeft size={18} /></button>
        <span className="current-month-label">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </span>
        <button className="btn-nav" onClick={nextMonth}><ChevronRight size={18} /></button>
      </div>

      <div className="calendar-grid-header">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="calendar-weekday">{day}</div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {renderDays()}
      </div>
    </div>
  );
};

export default CalendarWidget;

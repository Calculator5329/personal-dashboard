import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from 'date-fns';
import { CalendarHeader } from './CalendarHeader';
import { CalendarDay } from './CalendarDay';
import type { CalendarEvent } from '../../types/calendar';
import './Calendar.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarProps {
  currentDate: Date;
  events: CalendarEvent[];
  loading: boolean;
  onDateChange: (date: Date) => void;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export function Calendar({
  currentDate,
  events,
  loading,
  onDateChange,
  onDayClick,
  onEventClick,
}: CalendarProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const handleTodayClick = () => {
    onDateChange(new Date());
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick(event);
  };

  return (
    <div className="calendar">
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={onDateChange}
        onTodayClick={handleTodayClick}
      />

      {loading && (
        <div className="calendar-loading">
          <div className="loading-spinner" />
          <span>Loading events...</span>
        </div>
      )}

      <div className="calendar-grid">
        <div className="weekday-header">
          {WEEKDAYS.map((day) => (
            <div key={day} className="weekday-cell">
              {day}
            </div>
          ))}
        </div>

        <div className="days-grid">
          {calendarDays.map((date) => (
            <CalendarDay
              key={date.toISOString()}
              date={date}
              isCurrentMonth={isSameMonth(date, currentDate)}
              isToday={isToday(date)}
              events={events}
              onDayClick={onDayClick}
              onEventClick={handleEventClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


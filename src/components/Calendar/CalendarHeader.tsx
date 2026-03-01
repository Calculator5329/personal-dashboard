import { format, addMonths, subMonths } from 'date-fns';
import './CalendarHeader.css';

interface CalendarHeaderProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onTodayClick: () => void;
}

export function CalendarHeader({
  currentDate,
  onDateChange,
  onTodayClick,
}: CalendarHeaderProps) {
  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  return (
    <div className="calendar-header">
      <div className="header-left">
        <h1 className="current-month">{format(currentDate, 'MMMM yyyy')}</h1>
      </div>

      <div className="header-controls">
        <button
          className="nav-button today-button"
          onClick={onTodayClick}
          aria-label="Go to today"
        >
          Today
        </button>

        <div className="nav-arrows">
          <button
            className="nav-button arrow-button"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M12.5 15L7.5 10L12.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            className="nav-button arrow-button"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}


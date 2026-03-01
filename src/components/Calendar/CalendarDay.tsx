import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import type { CalendarEvent } from '../../types/calendar';
import './CalendarDay.css';

interface CalendarDayProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
}

const EVENT_COLORS = [
  'var(--event-blue)',
  'var(--event-green)',
  'var(--event-purple)',
  'var(--event-orange)',
  'var(--event-teal)',
  'var(--event-red)',
];

function getEventColor(eventId: string): string {
  // Use event ID to consistently assign colors
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = eventId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return EVENT_COLORS[Math.abs(hash) % EVENT_COLORS.length];
}

function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  return events.filter((event) => {
    const eventStart = event.start.dateTime
      ? parseISO(event.start.dateTime)
      : event.start.date
      ? parseISO(event.start.date)
      : null;

    const eventEnd = event.end.dateTime
      ? parseISO(event.end.dateTime)
      : event.end.date
      ? parseISO(event.end.date)
      : null;

    if (!eventStart || !eventEnd) return false;

    // Check if event overlaps with this day
    return (
      isWithinInterval(dayStart, { start: eventStart, end: eventEnd }) ||
      isWithinInterval(eventStart, { start: dayStart, end: dayEnd })
    );
  });
}

function formatEventTime(event: CalendarEvent): string {
  if (!event.start.dateTime) return 'All day';
  const time = parseISO(event.start.dateTime);
  return format(time, 'h:mm a');
}

export function CalendarDay({
  date,
  isCurrentMonth,
  isToday,
  events,
  onDayClick,
  onEventClick,
}: CalendarDayProps) {
  const dayEvents = getEventsForDay(events, date);
  const maxVisibleEvents = 3;
  const hiddenCount = Math.max(0, dayEvents.length - maxVisibleEvents);

  return (
    <div
      className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${
        isToday ? 'today' : ''
      }`}
      onClick={() => onDayClick(date)}
    >
      <div className="day-header">
        <span className={`day-number ${isToday ? 'today-badge' : ''}`}>
          {format(date, 'd')}
        </span>
      </div>

      <div className="day-events">
        {dayEvents.slice(0, maxVisibleEvents).map((event) => (
          <button
            key={event.id}
            className="event-chip"
            style={{ '--event-color': getEventColor(event.id) } as React.CSSProperties}
            onClick={(e) => onEventClick(event, e)}
            title={`${event.summary} - ${formatEventTime(event)}`}
          >
            <span className="event-dot" />
            <span className="event-title">{event.summary}</span>
          </button>
        ))}
        {hiddenCount > 0 && (
          <span className="more-events">+{hiddenCount} more</span>
        )}
      </div>
    </div>
  );
}


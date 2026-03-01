import { useState, useEffect, useCallback } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import type { CalendarEvent } from '../types/calendar';
import { fetchEvents, getAccessToken } from '../services/googleCalendar';

interface UseCalendarEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCalendarEvents(currentDate: Date): UseCalendarEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!getAccessToken()) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the full range visible in month view (includes days from adjacent months)
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const viewStart = startOfWeek(monthStart, { weekStartsOn: 0 });
      const viewEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

      const fetchedEvents = await fetchEvents(viewStart, viewEnd);
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    refetch: loadEvents,
  };
}


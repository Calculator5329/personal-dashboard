import type { CalendarEvent, EventFormData } from '../types/calendar';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';
const CALENDAR_ID = 'primary';

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export async function fetchEvents(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const timeMin = startDate.toISOString();
  const timeMax = endDate.toISOString();

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  const response = await apiRequest<{ items: CalendarEvent[] }>(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`
  );

  return response.items || [];
}

export async function createEvent(formData: EventFormData): Promise<CalendarEvent> {
  const event = formDataToEvent(formData);

  return apiRequest<CalendarEvent>(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
    {
      method: 'POST',
      body: JSON.stringify(event),
    }
  );
}

export async function updateEvent(
  eventId: string,
  formData: EventFormData
): Promise<CalendarEvent> {
  const event = formDataToEvent(formData);

  return apiRequest<CalendarEvent>(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PUT',
      body: JSON.stringify(event),
    }
  );
}

export async function deleteEvent(eventId: string): Promise<void> {
  await apiRequest(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    }
  );
}

interface RecurringEventData {
  summary: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  startTime?: string; // HH:MM (optional, for all-day events)
  endTime?: string;
  recurrence?: string[]; // RRULE format
  colorId?: string;
}

export async function createRecurringEvent(data: RecurringEventData): Promise<CalendarEvent> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  let event: Record<string, unknown>;
  
  if (data.startTime && data.endTime) {
    event = {
      summary: data.summary,
      description: data.description,
      start: { 
        dateTime: `${data.startDate}T${data.startTime}:00`, 
        timeZone 
      },
      end: { 
        dateTime: `${data.startDate}T${data.endTime}:00`, 
        timeZone 
      },
      recurrence: data.recurrence,
      colorId: data.colorId,
    };
  } else {
    // All-day event
    event = {
      summary: data.summary,
      description: data.description,
      start: { date: data.startDate },
      end: { date: data.startDate },
      recurrence: data.recurrence,
      colorId: data.colorId,
    };
  }

  return apiRequest<CalendarEvent>(
    `/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
    {
      method: 'POST',
      body: JSON.stringify(event),
    }
  );
}

export async function addSundayBalanceEvent(): Promise<void> {
  await createRecurringEvent({
    summary: '🏦 Est. Balance: $2,818',
    description: 'Weekly estimated bank account balance - update manually each week',
    startDate: '2026-01-04', // First Sunday of 2026
    startTime: '08:00',
    endTime: '08:30',
    recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=SU'],
    colorId: '7', // Cyan
  });
}

export async function createFinancialEvents(): Promise<{ created: number; errors: string[] }> {
  const events: RecurringEventData[] = [
    // Roth 3x $50 monthly on the 26th
    {
      summary: '💰 Roth 3x - $50',
      description: 'Monthly Roth 3x contribution',
      startDate: '2026-01-26',
      startTime: '09:00',
      endTime: '09:30',
      recurrence: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=26'],
      colorId: '10', // Green
    },
    // Roth IRA $575 monthly on the 15th
    {
      summary: '💰 Roth IRA - $575',
      description: 'Monthly Roth IRA contribution',
      startDate: '2026-01-15',
      startTime: '09:00',
      endTime: '09:30',
      recurrence: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=15'],
      colorId: '10', // Green
    },
    // Index Portfolio $100 Every Wednesday
    {
      summary: '📈 Index Portfolio - $100',
      description: 'Weekly index fund investment',
      startDate: '2026-01-07', // First Wednesday of Jan 2026
      startTime: '09:00',
      endTime: '09:30',
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=WE'],
      colorId: '9', // Blue
    },
    // YOLO $100 Monthly on the 22nd
    {
      summary: '🎲 YOLO - $100',
      description: 'Monthly speculative investment',
      startDate: '2026-01-22',
      startTime: '09:00',
      endTime: '09:30',
      recurrence: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=22'],
      colorId: '6', // Orange
    },
    // Growth Portfolio $600 Every other Tuesday (starting Jan 13 2026)
    {
      summary: '📊 Growth - $600',
      description: 'Bi-weekly growth portfolio investment',
      startDate: '2026-01-13',
      startTime: '09:00',
      endTime: '09:30',
      recurrence: ['RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=TU'],
      colorId: '11', // Red
    },
    // Starting bank balance 1/2/2026 $2818 (one-time)
    {
      summary: '🏦 Starting Balance: $2,818',
      description: 'Initial bank account balance',
      startDate: '2026-01-02',
      startTime: '08:00',
      endTime: '08:30',
      // No recurrence - one time event
    },
    // Paycheck $2418 every other Friday starting 1/2/2026
    {
      summary: '💵 Paycheck - $2,418',
      description: 'Bi-weekly paycheck deposit',
      startDate: '2026-01-02',
      startTime: '08:00',
      endTime: '08:30',
      recurrence: ['RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=FR'],
      colorId: '2', // Green (sage)
    },
    // Credit card payment $1000 monthly on the 9th
    {
      summary: '💳 Credit Card Payment - $1,000',
      description: 'Estimated monthly credit card payment',
      startDate: '2026-01-09',
      startTime: '09:00',
      endTime: '09:30',
      recurrence: ['RRULE:FREQ=MONTHLY;BYMONTHDAY=9'],
      colorId: '4', // Pink/Red
    },
    // Estimated bank balance every Sunday
    {
      summary: '🏦 Est. Balance: $2,818',
      description: 'Weekly estimated bank account balance - update manually each week',
      startDate: '2026-01-04', // First Sunday of 2026
      startTime: '08:00',
      endTime: '08:30',
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=SU'],
      colorId: '7', // Cyan
    },
  ];

  let created = 0;
  const errors: string[] = [];

  for (const event of events) {
    try {
      await createRecurringEvent(event);
      created++;
    } catch (error) {
      errors.push(`Failed to create "${event.summary}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { created, errors };
}

function formDataToEvent(formData: EventFormData): Partial<CalendarEvent> {
  if (formData.allDay) {
    return {
      summary: formData.summary,
      description: formData.description || undefined,
      start: { date: formData.startDate },
      end: { date: formData.endDate },
    };
  }

  const startDateTime = `${formData.startDate}T${formData.startTime}:00`;
  const endDateTime = `${formData.endDate}T${formData.endTime}:00`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    summary: formData.summary,
    description: formData.description || undefined,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
  };
}

export function eventToFormData(event: CalendarEvent): EventFormData {
  const isAllDay = !event.start.dateTime;

  if (isAllDay) {
    return {
      summary: event.summary || '',
      description: event.description || '',
      startDate: event.start.date || '',
      startTime: '09:00',
      endDate: event.end.date || '',
      endTime: '10:00',
      allDay: true,
    };
  }

  const startDT = new Date(event.start.dateTime!);
  const endDT = new Date(event.end.dateTime!);

  return {
    summary: event.summary || '',
    description: event.description || '',
    startDate: formatDateForInput(startDT),
    startTime: formatTimeForInput(startDT),
    endDate: formatDateForInput(endDT),
    endTime: formatTimeForInput(endDT),
    allDay: false,
  };
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatTimeForInput(date: Date): string {
  return date.toTimeString().slice(0, 5);
}


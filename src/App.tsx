import { useState, useCallback } from 'react';
import { Calendar } from './components/Calendar/Calendar';
import { EventModal } from './components/EventModal/EventModal';
import { GoogleAuth } from './components/Auth/GoogleAuth';
import { useCalendarEvents } from './hooks/useCalendarEvents';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  setAccessToken,
  createFinancialEvents,
  addSundayBalanceEvent,
} from './services/googleCalendar';
import type { CalendarEvent, EventFormData, ModalMode } from './types/calendar';
import './App.css';

interface UserInfo {
  name: string;
  picture: string;
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { events, loading, refetch } = useCalendarEvents(currentDate);

  // Financial setup state
  const [settingUpFinancials, setSettingUpFinancials] = useState(false);
  const [setupMessage, setSetupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSetupFinancials = async () => {
    setSettingUpFinancials(true);
    setSetupMessage(null);
    
    try {
      const result = await createFinancialEvents();
      if (result.errors.length > 0) {
        setSetupMessage({ 
          type: 'error', 
          text: `Created ${result.created} events. Errors: ${result.errors.join(', ')}` 
        });
      } else {
        setSetupMessage({ 
          type: 'success', 
          text: `Successfully created ${result.created} recurring financial events!` 
        });
      }
      await refetch();
    } catch (error) {
      setSetupMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create events' 
      });
    } finally {
      setSettingUpFinancials(false);
      // Clear message after 5 seconds
      setTimeout(() => setSetupMessage(null), 5000);
    }
  };

  const handleAddSundayBalance = async () => {
    setSettingUpFinancials(true);
    setSetupMessage(null);
    
    try {
      await addSundayBalanceEvent();
      setSetupMessage({ 
        type: 'success', 
        text: 'Added weekly Sunday balance event!' 
      });
      await refetch();
    } catch (error) {
      setSetupMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to create event' 
      });
    } finally {
      setSettingUpFinancials(false);
      setTimeout(() => setSetupMessage(null), 5000);
    }
  };

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      setUserInfo({ name: data.name, picture: data.picture });
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  };

  const handleSignIn = async (token: string) => {
    setAccessToken(token);
    setIsSignedIn(true);
    await fetchUserInfo(token);
    refetch();
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    setUserInfo(null);
  };

  const handleDayClick = (date: Date) => {
    if (!isSignedIn) return;
    setSelectedDate(date);
    setSelectedEvent(null);
    setModalMode('create');
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (!isSignedIn) return;
    setSelectedEvent(event);
    setSelectedDate(null);
    setModalMode('edit');
  };

  const handleCloseModal = () => {
    setModalMode(null);
    setSelectedEvent(null);
    setSelectedDate(null);
  };

  const handleSaveEvent = useCallback(
    async (formData: EventFormData) => {
      if (selectedEvent) {
        await updateEvent(selectedEvent.id, formData);
      } else {
        await createEvent(formData);
      }
      await refetch();
    },
    [selectedEvent, refetch]
  );

  const handleDeleteEvent = useCallback(
    async (eventId: string) => {
      await deleteEvent(eventId);
      await refetch();
    },
    [refetch]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <svg className="logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="4" width="24" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 10h24" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 2v4M20 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="7" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.6" />
            <rect x="12" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="17" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.2" />
          </svg>
          <span className="brand-text">Calendar</span>
        </div>
        
        <div className="header-actions">
          {isSignedIn && (
            <>
              <button 
                className="setup-financials-btn"
                onClick={handleAddSundayBalance}
                disabled={settingUpFinancials}
                title="Add weekly Sunday balance tracking event"
              >
                + Sunday Balance
              </button>
              <button 
                className="setup-financials-btn"
                onClick={handleSetupFinancials}
                disabled={settingUpFinancials}
              >
                {settingUpFinancials ? 'Setting up...' : 'Setup All Financials'}
              </button>
            </>
          )}
          <GoogleAuth
          isSignedIn={isSignedIn}
          userInfo={userInfo}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />
        </div>
      </header>

      {setupMessage && (
        <div className={`setup-message ${setupMessage.type}`}>
          {setupMessage.text}
        </div>
      )}

      <main className="app-main">
        {!isSignedIn ? (
          <div className="welcome-message">
            <div className="welcome-icon">
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <rect x="8" y="12" width="48" height="40" rx="6" stroke="currentColor" strokeWidth="2" />
                <path d="M8 24h48" stroke="currentColor" strokeWidth="2" />
                <path d="M20 6v8M44 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="16" y="32" width="8" height="8" rx="2" fill="var(--accent)" opacity="0.8" />
                <rect x="28" y="32" width="8" height="8" rx="2" fill="currentColor" opacity="0.3" />
                <rect x="40" y="32" width="8" height="8" rx="2" fill="currentColor" opacity="0.2" />
              </svg>
            </div>
            <h2>Connect your Google Calendar</h2>
            <p>Sign in to view and manage your calendar events</p>
          </div>
        ) : (
          <Calendar
            currentDate={currentDate}
            events={events}
            loading={loading}
            onDateChange={setCurrentDate}
            onDayClick={handleDayClick}
            onEventClick={handleEventClick}
          />
        )}
      </main>

      <EventModal
        mode={modalMode}
        event={selectedEvent}
        selectedDate={selectedDate}
        onClose={handleCloseModal}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}

export default App;

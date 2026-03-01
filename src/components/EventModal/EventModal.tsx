import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { CalendarEvent, EventFormData, ModalMode } from '../../types/calendar';
import { eventToFormData } from '../../services/googleCalendar';
import './EventModal.css';

interface EventModalProps {
  mode: ModalMode;
  event: CalendarEvent | null;
  selectedDate: Date | null;
  onClose: () => void;
  onSave: (formData: EventFormData) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
}

function getDefaultFormData(date: Date | null): EventFormData {
  const now = date || new Date();
  const dateStr = format(now, 'yyyy-MM-dd');

  return {
    summary: '',
    description: '',
    startDate: dateStr,
    startTime: '09:00',
    endDate: dateStr,
    endTime: '10:00',
    allDay: false,
  };
}

export function EventModal({
  mode,
  event,
  selectedDate,
  onClose,
  onSave,
  onDelete,
}: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>(() =>
    event ? eventToFormData(event) : getDefaultFormData(selectedDate)
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      setFormData(eventToFormData(event));
    } else {
      setFormData(getDefaultFormData(selectedDate));
    }
  }, [event, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.summary.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;

    setDeleting(true);
    setError(null);

    try {
      await onDelete(event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mode) return null;

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2 className="modal-title">
            {mode === 'create' ? 'New Event' : 'Edit Event'}
          </h2>
          <button
            className="close-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5L5 15M5 5L15 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="summary" className="form-label">
              Title
            </label>
            <input
              type="text"
              id="summary"
              name="summary"
              className="form-input"
              value={formData.summary}
              onChange={handleChange}
              placeholder="Add title"
              autoFocus
            />
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="allDay"
                checked={formData.allDay}
                onChange={handleChange}
              />
              <span>All day</span>
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Start
              </label>
              <div className="datetime-inputs">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  className="form-input"
                  value={formData.startDate}
                  onChange={handleChange}
                />
                {!formData.allDay && (
                  <input
                    type="time"
                    name="startTime"
                    className="form-input time-input"
                    value={formData.startTime}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="endDate" className="form-label">
                End
              </label>
              <div className="datetime-inputs">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="form-input"
                  value={formData.endDate}
                  onChange={handleChange}
                />
                {!formData.allDay && (
                  <input
                    type="time"
                    name="endTime"
                    className="form-input time-input"
                    value={formData.endTime}
                    onChange={handleChange}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add description"
              rows={3}
            />
          </div>

          <div className="modal-footer">
            {mode === 'edit' && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            <div className="footer-right">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || deleting}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


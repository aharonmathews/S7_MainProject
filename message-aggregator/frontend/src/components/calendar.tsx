import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { calendarApi } from "../services/calendarApi";
import { CalendarEvent } from "../types/calendar";
import EventModal from "./EventModal";

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { getToken } = useAuth();

  useEffect(() => {
    loadEvents();
  }, [currentMonth]);

  const loadEvents = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const events = await calendarApi.getEvents(token);
      setEvents(events);
      setLoading(false);
    } catch (error) {
      console.error("Error loading events:", error);
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Delete this event?")) return;

    try {
      const token = await getToken();
      if (!token) return;

      await calendarApi.deleteEvent(token, eventId);
      loadEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      alert("Failed to delete event");
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getEventsForDate = (date: string) => {
    return events.filter((event) => event.date === date);
  };

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString("default", { month: "long" });
  const year = currentMonth.getFullYear();

  const previousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-gray-600 dark:text-gray-400">
            Loading calendar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-teal-600 bg-clip-text text-transparent">
          📅 Calendar
        </h1>
        <button
          onClick={handleCreateEvent}
          className="btn-primary flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Event
        </button>
      </div>

      {/* Month Navigation */}
      <div className="card p-6 mb-8 flex items-center justify-between">
        <button
          onClick={previousMonth}
          className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors group"
        >
          <svg
            className="w-6 h-6 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {monthName} {year}
        </h2>

        <button
          onClick={nextMonth}
          className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors group"
        >
          <svg
            className="w-6 h-6 group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="card p-6 animate-slide-up">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center font-bold py-3 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg text-gray-700 dark:text-gray-300"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="min-h-[120px]" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dateStr = formatDate(year, currentMonth.getMonth(), day);
            const dayEvents = getEventsForDate(dateStr);
            const isToday =
              new Date().toDateString() ===
              new Date(year, currentMonth.getMonth(), day).toDateString();

            return (
              <div
                key={day}
                className={`border-2 rounded-xl p-3 min-h-[120px] transition-all duration-200 ${
                  isToday
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg"
                    : "border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-primary-300 dark:hover:border-primary-700"
                }`}
              >
                <div
                  className={`font-bold mb-2 text-sm ${
                    isToday
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {day}
                  {isToday && (
                    <span className="ml-2 text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 truncate"
                      title={event.title}
                    >
                      {event.time && (
                        <span className="font-bold">{event.time} </span>
                      )}
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
          }}
          onSave={loadEvents}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
};

export default Calendar;

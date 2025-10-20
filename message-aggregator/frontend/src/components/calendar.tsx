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
      <div style={{ padding: "20px", textAlign: "center" }}>
        Loading calendar...
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>📅 Calendar</h1>
        <button
          onClick={handleCreateEvent}
          style={{
            padding: "10px 20px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          + New Event
        </button>
      </div>

      {/* Month Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          backgroundColor: "white",
          padding: "15px",
          borderRadius: "8px",
        }}
      >
        <button
          onClick={previousMonth}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "white",
          }}
        >
          ← Previous
        </button>
        <h2>
          {monthName} {year}
        </h2>
        <button
          onClick={nextMonth}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "white",
          }}
        >
          Next →
        </button>
      </div>

      {/* Calendar Grid */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        {/* Day Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              style={{
                textAlign: "center",
                fontWeight: "bold",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "10px",
          }}
        >
          {/* Empty cells for days before month starts */}
          {Array.from({ length: startingDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} style={{ minHeight: "100px" }} />
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
                style={{
                  border: `2px solid ${isToday ? "#007bff" : "#e0e0e0"}`,
                  borderRadius: "8px",
                  padding: "10px",
                  minHeight: "100px",
                  backgroundColor: isToday ? "#e3f2fd" : "white",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: "8px",
                    color: isToday ? "#007bff" : "#333",
                  }}
                >
                  {day}
                </div>
                <div style={{ fontSize: "12px" }}>
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => handleEventClick(event)}
                      style={{
                        backgroundColor: "#007bff",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        marginBottom: "4px",
                        cursor: "pointer",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {event.time && `${event.time} `}
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

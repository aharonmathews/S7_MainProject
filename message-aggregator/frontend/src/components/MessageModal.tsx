import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

interface Message {
  id: string;
  platform: string;
  title: string;
  content: string;
  sender: string;
  timestamp: string;
  chat?: string;
  url?: string;
  ai_scores?: {
    semantic_score?: number;
    keyword_score?: number;
    overall_score?: number;
  };
}

interface ExtractedEvent {
  date: string | null;
  date_display: string | null;
  date_text: string | null;
  time: string | null;
  time_display: string | null;
  time_text: string | null;
  context: string;
}

interface MessageModalProps {
  message: Message;
  onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ message, onClose }) => {
  const [extractedEvents, setExtractedEvents] = useState<ExtractedEvent[]>([]);
  const [loadingDates, setLoadingDates] = useState(true);
  const [savingEvent, setSavingEvent] = useState<number | null>(null);
  const { user, getToken } = useAuth(); // ✅ Add getToken

  useEffect(() => {
    extractDatesFromMessage();
  }, [message]);

  const extractDatesFromMessage = async () => {
    try {
      setLoadingDates(true);
      const response = await axios.post("http://localhost:8000/extract-dates", {
        text: message.content,
        title: message.title,
      });

      setExtractedEvents(response.data.events || []);
      console.log(`📅 Found ${response.data.count} date/time mentions`);
    } catch (error) {
      console.error("Error extracting dates:", error);
    } finally {
      setLoadingDates(false);
    }
  };

  // ...existing code...

  const handleAddToCalendar = async (event: ExtractedEvent, index: number) => {
    if (!user) {
      alert("Please log in to add events");
      return;
    }

    if (!event.date) {
      alert("No date specified for this event");
      return;
    }

    setSavingEvent(index);

    try {
      // ✅ Get the authentication token
      const token = await getToken();
      if (!token) {
        alert("Authentication required");
        setSavingEvent(null);
        return;
      }

      // Create event from message
      const eventData = {
        title: message.title || "Event from message",
        description: event.context || message.content.substring(0, 200),
        date: event.date,
        time: event.time || "",
        platform: message.platform,
        message_id: message.id,
      };

      const response = await axios.post(
        `http://localhost:8000/api/calendar/events`, // ✅ No query params
        eventData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // ✅ Send Bearer token
          },
        }
      );

      alert("✅ Event added to calendar!");
      console.log("Event created:", response.data);
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      alert(
        `Failed to add event: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setSavingEvent(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "30px",
          borderRadius: "12px",
          maxWidth: "700px",
          width: "90%",
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "20px",
            borderBottom: "2px solid #e0e0e0",
            paddingBottom: "15px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "inline-block",
                backgroundColor: "#007bff",
                color: "white",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                marginBottom: "8px",
              }}
            >
              {message.platform}
            </div>
            <h2 style={{ margin: "8px 0 0 0", fontSize: "24px" }}>
              {message.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "28px",
              cursor: "pointer",
              color: "#666",
              padding: "0",
              marginLeft: "15px",
            }}
          >
            ×
          </button>
        </div>

        {/* Message Details */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "10px" }}>
            <strong>👤 SENDER</strong>
            <p style={{ margin: "5px 0", color: "#555" }}>{message.sender}</p>
          </div>

          {message.chat && (
            <div style={{ marginBottom: "10px" }}>
              <strong>💬 CHAT/CHANNEL</strong>
              <p style={{ margin: "5px 0", color: "#555" }}>{message.chat}</p>
            </div>
          )}

          <div style={{ marginBottom: "10px" }}>
            <strong>🕐 TIMESTAMP</strong>
            <p style={{ margin: "5px 0", color: "#555" }}>
              {new Date(message.timestamp).toLocaleString()}
            </p>
          </div>

          {/* AI Curation Scores */}
          {message.ai_scores && (
            <div style={{ marginBottom: "10px" }}>
              <strong>🤖 AI CURATION SCORES</strong>
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginTop: "8px",
                  fontSize: "14px",
                }}
              >
                <span>
                  🧠 Semantic:{" "}
                  {Math.round((message.ai_scores.semantic_score || 0) * 100)}%
                </span>
                <span>
                  🔑 Keywords:{" "}
                  {Math.round((message.ai_scores.keyword_score || 0) * 100)}%
                </span>
                <span>
                  ⚡ Overall:{" "}
                  {Math.round((message.ai_scores.overall_score || 0) * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Extracted Dates & Times */}
        {!loadingDates && extractedEvents.length > 0 && (
          <div
            style={{
              backgroundColor: "#f0f8ff",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "2px solid #007bff",
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", color: "#007bff" }}>
              📅 Dates & Times Found
            </h3>
            {extractedEvents.map((event, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: "white",
                  padding: "12px",
                  borderRadius: "6px",
                  marginBottom: "10px",
                  border: "1px solid #cce7ff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    {event.date && (
                      <div style={{ marginBottom: "4px" }}>
                        <strong>📅 Date:</strong>{" "}
                        <span style={{ color: "#007bff", fontWeight: "bold" }}>
                          {event.date_display}
                        </span>
                        <span
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            marginLeft: "8px",
                          }}
                        >
                          ({event.date_text})
                        </span>
                      </div>
                    )}
                    {event.time && (
                      <div>
                        <strong>🕐 Time:</strong>{" "}
                        <span style={{ color: "#28a745", fontWeight: "bold" }}>
                          {event.time_display}
                        </span>
                        <span
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            marginLeft: "8px",
                          }}
                        >
                          ({event.time_text})
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddToCalendar(event, index)}
                    disabled={savingEvent === index || !event.date}
                    style={{
                      padding: "8px 16px",
                      backgroundColor:
                        savingEvent === index || !event.date
                          ? "#ccc"
                          : "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor:
                        savingEvent === index || !event.date
                          ? "not-allowed"
                          : "pointer",
                      fontSize: "14px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {savingEvent === index ? "Adding..." : "📅 Add to Calendar"}
                  </button>
                </div>
                {event.context && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontStyle: "italic",
                      marginTop: "8px",
                      paddingTop: "8px",
                      borderTop: "1px solid #e0e0e0",
                    }}
                  >
                    Context: "...{event.context}..."
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {loadingDates && (
          <div
            style={{
              textAlign: "center",
              padding: "15px",
              color: "#999",
              fontStyle: "italic",
            }}
          >
            🔍 Scanning for dates and times...
          </div>
        )}

        {/* Message Content */}
        <div style={{ marginBottom: "20px" }}>
          <strong style={{ display: "block", marginBottom: "8px" }}>
            📄 Content
          </strong>
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "15px",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
              maxHeight: "300px",
              overflow: "auto",
              fontSize: "14px",
              lineHeight: "1.6",
            }}
          >
            {message.content}
          </div>
        </div>

        {/* View Original Link */}
        {message.url && (
          <a
            href={message.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            🔗 View Original on {message.platform}
          </a>
        )}
      </div>
    </div>
  );
};

export default MessageModal;

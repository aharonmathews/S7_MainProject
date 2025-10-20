import React from "react";
import MessageCard from "./MessageCard";
import { Message } from "../types";

interface MessageListProps {
  messages:
    | {
        important?: Message[];
        regular?: Message[];
        important_count?: number;
        total_count?: number;
        preferences_used?: string[];
      }
    | null
    | undefined;
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  // Handle null/undefined messages
  if (!messages) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        <h2>No messages loaded yet</h2>
        <p>Select platforms and click "Load Messages" to get started.</p>
      </div>
    );
  }

  const important = messages.important || [];
  const regular = messages.regular || [];
  const allMessages = [...important, ...regular];

  if (allMessages.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>
        <h2>No messages available</h2>
        <p>Select platforms and connect your accounts.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Important Messages Section */}
      {important.length > 0 && (
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "20px",
              padding: "15px",
              backgroundColor: "#fff3cd",
              borderRadius: "8px",
              border: "2px solid #ffc107",
            }}
          >
            <span style={{ fontSize: "24px", marginRight: "10px" }}>⭐</span>
            <div>
              <h2 style={{ margin: 0, color: "#856404" }}>
                Important Messages ({important.length})
              </h2>
              {messages.preferences_used &&
                messages.preferences_used.length > 0 && (
                  <p
                    style={{
                      margin: "5px 0 0 0",
                      fontSize: "14px",
                      color: "#856404",
                    }}
                  >
                    Based on your preferences:{" "}
                    {messages.preferences_used.join(", ")}
                  </p>
                )}
            </div>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {important.map((message) => (
              <div
                key={message.id}
                style={{
                  border: "2px solid #ffc107",
                  borderRadius: "8px",
                  overflow: "hidden",
                  backgroundColor: "white",
                }}
              >
                <MessageCard message={message} />
                {message.importance_score && (
                  <div
                    style={{
                      padding: "8px 15px",
                      backgroundColor: "#fff3cd",
                      fontSize: "12px",
                      color: "#856404",
                      textAlign: "right",
                      fontWeight: "bold",
                    }}
                  >
                    Relevance: {(message.importance_score * 100).toFixed(0)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Messages Section */}
      {regular.length > 0 && (
        <div>
          <h2 style={{ marginBottom: "20px", color: "#666" }}>
            All Messages ({regular.length})
          </h2>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {regular.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div
        style={{
          marginTop: "30px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "14px",
          color: "#666",
        }}
      >
        📊 Showing {allMessages.length} total messages
        {messages.important_count && messages.important_count > 0 && (
          <span> • ⭐ {messages.important_count} marked as important</span>
        )}
      </div>
    </div>
  );
};

export default MessageList;

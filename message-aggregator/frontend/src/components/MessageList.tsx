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
        curation_method?: string;
        curation_stats?: {
          avg_semantic_score?: number;
          avg_tfidf_score?: number;
          avg_hybrid_score?: number;
          preferences_matched?: Record<string, number>;
        };
      }
    | null
    | undefined;
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
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
  const stats = messages.curation_stats;

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
      {/* Curation Stats Banner */}
      {stats && messages.curation_method === "hybrid" && (
        <div
          style={{
            marginBottom: "20px",
            padding: "15px",
            backgroundColor: "#e3f2fd",
            borderRadius: "8px",
            border: "1px solid #2196f3",
          }}
        >
          <h3
            style={{ margin: "0 0 10px 0", color: "#1976d2", fontSize: "16px" }}
          >
            🤖 AI-Powered Curation Active
          </h3>
          <div
            style={{
              display: "flex",
              gap: "20px",
              flexWrap: "wrap",
              fontSize: "13px",
            }}
          >
            <div>
              <strong>Semantic Score:</strong>{" "}
              {(stats.avg_semantic_score! * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Keyword Score:</strong>{" "}
              {(stats.avg_tfidf_score! * 100).toFixed(1)}%
            </div>
            <div>
              <strong>Overall Relevance:</strong>{" "}
              {(stats.avg_hybrid_score! * 100).toFixed(1)}%
            </div>
          </div>
          {stats.preferences_matched &&
            Object.keys(stats.preferences_matched).length > 0 && (
              <div
                style={{ marginTop: "10px", fontSize: "12px", color: "#555" }}
              >
                <strong>Matched Topics:</strong>{" "}
                {Object.entries(stats.preferences_matched)
                  .map(([pref, count]) => `${pref} (${count})`)
                  .join(", ")}
              </div>
            )}
        </div>
      )}

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
                <div
                  style={{
                    padding: "8px 15px",
                    backgroundColor: "#fff3cd",
                    fontSize: "11px",
                    color: "#856404",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    {message.semantic_score && (
                      <span style={{ marginRight: "15px" }}>
                        🧠 Semantic: {(message.semantic_score * 100).toFixed(0)}
                        %
                      </span>
                    )}
                    {message.tfidf_score && (
                      <span style={{ marginRight: "15px" }}>
                        🔑 Keywords: {(message.tfidf_score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {message.hybrid_score && (
                    <div style={{ fontWeight: "bold", fontSize: "12px" }}>
                      Overall: {(message.hybrid_score * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
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
        {messages.curation_method === "hybrid" && (
          <span> • 🤖 AI-powered curation active</span>
        )}
      </div>
    </div>
  );
};

export default MessageList;

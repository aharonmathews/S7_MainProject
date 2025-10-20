import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { savedMessagesApi } from "../services/savedMessagesApi";
import MessageModal from "./MessageModal";

interface SavedMessage {
  id: string; // saved document ID
  message_id: string; // original message ID
  platform: string;
  title: string;
  content: string;
  sender: string;
  timestamp: string;
  chat?: string;
  url?: string;
  saved_at: string;
  ai_scores?: {
    semantic_score?: number;
    keyword_score?: number;
    overall_score?: number;
  };
}

const SavedMessages: React.FC = () => {
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SavedMessage | null>(
    null
  );
  const { getToken } = useAuth();

  useEffect(() => {
    loadSavedMessages();
  }, []);

  const loadSavedMessages = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const messages = await savedMessagesApi.getSavedMessages(token);
      console.log("📥 Loaded saved messages:", messages);
      setSavedMessages(messages);
      setLoading(false);
    } catch (error) {
      console.error("Error loading saved messages:", error);
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (savedId: string) => {
    if (!confirm("Remove this message from saved?")) return;

    try {
      const token = await getToken();
      if (!token) return;

      await savedMessagesApi.deleteSavedMessage(token, savedId);
      console.log(`✅ Deleted saved message: ${savedId}`);
      loadSavedMessages(); // Reload list
      setSelectedMessage(null); // Close modal if open
    } catch (error) {
      console.error("Error deleting saved message:", error);
      alert("Failed to delete message");
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      telegram: "#0088cc",
      twitter: "#1da1f2",
      gmail: "#ea4335",
      reddit: "#ff4500",
      slack: "#4a154b",
      discord: "#5865f2",
    };
    return colors[platform] || "#6c757d";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontSize: "18px", color: "#666" }}>
          Loading saved messages...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💾 Saved Messages</h1>

      {savedMessages.length === 0 ? (
        <div
          style={{
            padding: "60px 40px",
            textAlign: "center",
            color: "#999",
            backgroundColor: "white",
            borderRadius: "12px",
            marginTop: "20px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>💾</div>
          <h2 style={{ color: "#666", marginBottom: "10px" }}>
            No saved messages yet
          </h2>
          <p style={{ fontSize: "16px" }}>
            Click the "💾 Save" button on any message to save it here for later!
          </p>
        </div>
      ) : (
        <div>
          <p
            style={{
              color: "#666",
              marginBottom: "20px",
              fontSize: "16px",
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            📊 You have {savedMessages.length} saved message
            {savedMessages.length !== 1 ? "s" : ""}
          </p>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {savedMessages.map((message) => (
              <div
                key={message.id}
                style={{
                  position: "relative",
                  padding: "20px",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border: "1px solid #ddd",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
                onClick={() => setSelectedMessage(message)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(0,0,0,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent opening modal
                    handleDeleteMessage(message.id);
                  }}
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    padding: "8px 14px",
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "bold",
                    transition: "background-color 0.2s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#c82333")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "#dc3545")
                  }
                >
                  🗑️ Remove
                </button>

                {/* Message Header */}
                <div style={{ marginBottom: "12px", paddingRight: "100px" }}>
                  <h3
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      color: "#333",
                    }}
                  >
                    {message.title}
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      flexWrap: "wrap",
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    <span
                      style={{
                        backgroundColor: getPlatformColor(message.platform),
                        color: "white",
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontWeight: "bold",
                        textTransform: "capitalize",
                      }}
                    >
                      {message.platform}
                    </span>
                    {message.sender && <span>👤 {message.sender}</span>}
                    {message.chat && <span>💬 {message.chat}</span>}
                  </div>
                </div>

                {/* Message Content Preview */}
                <div
                  style={{
                    marginTop: "12px",
                    padding: "12px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      color: "#555",
                      lineHeight: "1.6",
                      fontSize: "14px",
                    }}
                  >
                    {truncateText(message.content, 200)}
                  </p>
                </div>

                {/* Timestamps */}
                <div
                  style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e9ecef",
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    color: "#999",
                  }}
                >
                  <span>
                    📅 Original:{" "}
                    {new Date(message.timestamp).toLocaleDateString()}
                  </span>
                  <span>
                    💾 Saved: {new Date(message.saved_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Click hint */}
                <div
                  style={{
                    marginTop: "8px",
                    fontSize: "12px",
                    color: "#999",
                    fontStyle: "italic",
                  }}
                >
                  Click to view full details...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {selectedMessage && (
        <MessageModal
          message={{
            id: selectedMessage.message_id, // Use original message_id
            platform: selectedMessage.platform,
            title: selectedMessage.title,
            content: selectedMessage.content,
            sender: selectedMessage.sender,
            timestamp: selectedMessage.timestamp,
            chat: selectedMessage.chat,
            url: selectedMessage.url,
            ai_scores: selectedMessage.ai_scores,
          }}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
};

export default SavedMessages;

import React from "react";
import { Message } from "../types";

interface MessageCardProps {
  message: Message;
  onClick: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      telegram: "#0088cc",
      twitter: "#1da1f2",
      gmail: "#ea4335",
      reddit: "#ff4500",
      slack: "#4a154b",
    };
    return colors[platform] || "#6c757d";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      onClick={onClick}
      style={{
        padding: "15px",
        backgroundColor: "white",
        borderRadius: "8px",
        border: "1px solid #ddd",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "start",
          marginBottom: "10px",
        }}
      >
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: "0 0 5px 0", fontSize: "16px", color: "#333" }}>
            {message.title}
          </h3>
          <div
            style={{
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              fontSize: "12px",
              color: "#666",
            }}
          >
            <span
              style={{
                backgroundColor: getPlatformColor(message.platform),
                color: "white",
                padding: "2px 8px",
                borderRadius: "12px",
                fontWeight: "bold",
                textTransform: "capitalize",
              }}
            >
              {message.platform}
            </span>
            {message.sender && <span>👤 {message.sender}</span>}
            {message.chat && <span>💬 {message.chat}</span>}
            <span>🕐 {new Date(message.timestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Content Preview */}
      <div style={{ marginTop: "10px" }}>
        <p style={{ margin: 0, color: "#555", lineHeight: "1.6" }}>
          {truncateText(message.content, 150)}
        </p>
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
  );
};

export default MessageCard;

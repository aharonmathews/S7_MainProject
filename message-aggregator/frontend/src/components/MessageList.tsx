import React from "react";
import MessageCard from "./MessageCard";
import { Message } from "../types";

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages = [] }) => {
  if (messages.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
        No messages available. Select platforms and connect your accounts.
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      {messages.map((message) => (
        <MessageCard key={message.id} message={message} />
      ))}
    </div>
  );
};

export default MessageList;

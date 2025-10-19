import React from "react";
import { Message } from "../types";

interface MessageCardProps {
  message: Message;
}

const MessageCard: React.FC<MessageCardProps> = ({ message }) => {
  return (
    <div className="message-card">
      <h3>{message.title}</h3>
      <p>{message.content}</p>
      <span>{message.platform}</span>
      <span>{new Date(message.timestamp).toLocaleString()}</span>
    </div>
  );
};

export default MessageCard;

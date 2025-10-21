import React from "react";
import { Message } from "../types";

interface MessageCardProps {
  message: Message;
  onClick: () => void;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onClick }) => {
  const getPlatformConfig = (platform: string) => {
    const configs: Record<
      string,
      { color: string; icon: string; gradient: string }
    > = {
      telegram: {
        color: "bg-blue-500",
        icon: "📱",
        gradient: "from-blue-500 to-blue-600",
      },
      twitter: {
        color: "bg-sky-400",
        icon: "🐦",
        gradient: "from-sky-400 to-blue-500",
      },
      gmail: {
        color: "bg-red-500",
        icon: "📧",
        gradient: "from-red-500 to-pink-500",
      },
      reddit: {
        color: "bg-orange-500",
        icon: "🔶",
        gradient: "from-orange-500 to-red-500",
      },
      slack: {
        color: "bg-purple-600",
        icon: "💬",
        gradient: "from-purple-600 to-pink-500",
      },
      discord: {
        color: "bg-indigo-500",
        icon: "🎮",
        gradient: "from-indigo-500 to-purple-600",
      },
    };
    return (
      configs[platform] || {
        color: "bg-gray-500",
        icon: "📬",
        gradient: "from-gray-500 to-gray-600",
      }
    );
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const config = getPlatformConfig(message.platform);
  const formattedDate = new Date(message.timestamp).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

  return (
    <div onClick={onClick} className="card card-hover p-5 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {message.title}
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r ${config.gradient}`}
            >
              <span>{config.icon}</span>
              <span className="capitalize">{message.platform}</span>
            </span>
            {message.sender && (
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {message.sender}
              </span>
            )}
            {message.chat && (
              <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {message.chat}
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {formattedDate}
        </div>
      </div>

      {/* Content Preview */}
      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
        {truncateText(message.content, 200)}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-dark-border">
        <span className="text-xs text-gray-500 dark:text-gray-400 italic">
          Click to view details
        </span>
        <svg
          className="w-5 h-5 text-primary-500 group-hover:translate-x-1 transition-transform"
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
      </div>
    </div>
  );
};

export default MessageCard;

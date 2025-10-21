import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { savedMessagesApi } from "../services/savedMessagesApi";

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
  const [isSaved, setIsSaved] = useState(false);
  const [savingMessage, setSavingMessage] = useState(false);
  const { user, getToken } = useAuth();

  useEffect(() => {
    extractDatesFromMessage();
    checkIfMessageSaved();
  }, [message]);

  const extractDatesFromMessage = async () => {
    try {
      setLoadingDates(true);
      const response = await axios.post("http://localhost:8000/extract-dates", {
        text: message.content,
        title: message.title,
      });
      setExtractedEvents(response.data.events || []);
    } catch (error) {
      console.error("Error extracting dates:", error);
    } finally {
      setLoadingDates(false);
    }
  };

  const checkIfMessageSaved = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const saved = await savedMessagesApi.checkIfSaved(token, message.id);
      setIsSaved(saved);
    } catch (error) {
      console.error("Error checking if message is saved:", error);
    }
  };

  const handleSaveMessage = async () => {
    if (!user) {
      alert("Please log in to save messages");
      return;
    }

    setSavingMessage(true);
    try {
      const token = await getToken();
      if (!token) {
        alert("Authentication required");
        setSavingMessage(false);
        return;
      }

      if (isSaved) {
        const savedMessages = await savedMessagesApi.getSavedMessages(token);
        const savedMsg = savedMessages.find(
          (m: any) => m.message_id === message.id
        );
        if (savedMsg) {
          await savedMessagesApi.deleteSavedMessage(token, savedMsg.id);
          setIsSaved(false);
          alert("✅ Message removed from saved!");
        }
      } else {
        await savedMessagesApi.saveMessage(token, message);
        setIsSaved(true);
        alert("✅ Message saved successfully!");
      }
    } catch (error: any) {
      console.error("Error saving message:", error);
      alert(
        `Failed to save message: ${
          error.response?.data?.detail || error.message
        }`
      );
    } finally {
      setSavingMessage(false);
    }
  };

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
      const token = await getToken();
      if (!token) {
        alert("Authentication required");
        setSavingEvent(null);
        return;
      }

      const eventData = {
        title: message.title || "Event from message",
        description: event.context || message.content.substring(0, 200),
        date: event.date,
        time: event.time || "",
        platform: message.platform,
        message_id: message.id,
      };

      await axios.post(`http://localhost:8000/api/calendar/events`, eventData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("✅ Event added to calendar!");
    } catch (error: any) {
      console.error("Error adding to calendar:", error);
      alert(
        `Failed to add event: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setSavingEvent(null);
    }
  };

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      telegram: "from-blue-500 to-blue-600",
      twitter: "from-sky-400 to-blue-500",
      gmail: "from-red-500 to-pink-500",
      reddit: "from-orange-500 to-red-500",
      slack: "from-purple-600 to-pink-500",
      discord: "from-indigo-500 to-purple-600",
    };
    return colors[platform] || "from-gray-500 to-gray-600";
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glassmorphism Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-dark-card/95 dark:to-dark-bg/95 backdrop-blur-xl" />

        {/* Content */}
        <div className="relative overflow-y-auto max-h-[90vh] p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-gray-200 dark:border-dark-border">
            <div className="flex-1">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getPlatformColor(
                  message.platform
                )} text-white font-bold text-sm mb-3`}
              >
                <span className="text-lg">
                  {message.platform === "telegram"
                    ? "📱"
                    : message.platform === "twitter"
                    ? "🐦"
                    : message.platform === "gmail"
                    ? "📧"
                    : message.platform === "reddit"
                    ? "🔶"
                    : message.platform === "slack"
                    ? "💬"
                    : "🎮"}
                </span>
                <span className="capitalize">{message.platform}</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {message.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMessage}
                disabled={savingMessage}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  isSaved
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 dark:bg-dark-border dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                } ${
                  savingMessage
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:scale-105"
                }`}
              >
                {savingMessage ? "⏳" : isSaved ? "✅ Saved" : "💾 Save"}
              </button>

              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Message Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-sm font-medium">Sender</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {message.sender}
              </p>
            </div>

            {message.chat && (
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
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
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <span className="text-sm font-medium">Chat/Channel</span>
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {message.chat}
                </p>
              </div>
            )}

            <div className="card p-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">Timestamp</span>
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {new Date(message.timestamp).toLocaleString()}
              </p>
            </div>

            {message.ai_scores && (
              <div className="card p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
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
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  <span className="text-sm font-medium">AI Scores</span>
                </div>
                <div className="flex gap-3 text-sm">
                  <span>
                    🧠{" "}
                    {Math.round((message.ai_scores.semantic_score || 0) * 100)}%
                  </span>
                  <span>
                    🔑{" "}
                    {Math.round((message.ai_scores.keyword_score || 0) * 100)}%
                  </span>
                  <span>
                    ⚡{" "}
                    {Math.round((message.ai_scores.overall_score || 0) * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Extracted Dates & Times */}
          {!loadingDates && extractedEvents.length > 0 && (
            <div className="card p-6 mb-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-300 dark:border-blue-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    📅 Dates & Times Found
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {extractedEvents.length} event
                    {extractedEvents.length !== 1 ? "s" : ""} detected
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {extractedEvents.map((event, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-dark-card p-4 rounded-xl border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        {event.date && (
                          <div className="mb-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                              📅 {event.date_display}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({event.date_text})
                            </span>
                          </div>
                        )}
                        {event.time && (
                          <div>
                            <span className="text-green-600 dark:text-green-400 font-bold">
                              🕐 {event.time_display}
                            </span>
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({event.time_text})
                            </span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleAddToCalendar(event, index)}
                        disabled={savingEvent === index || !event.date}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                          savingEvent === index || !event.date
                            ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600 text-white hover:scale-105"
                        }`}
                      >
                        {savingEvent === index ? "Adding..." : "📅 Add"}
                      </button>
                    </div>

                    {event.context && (
                      <div className="pt-3 mt-3 border-t border-gray-200 dark:border-dark-border">
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                          "...{event.context}..."
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {loadingDates && (
            <div className="card p-6 mb-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-primary-500"
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
                <span className="text-gray-600 dark:text-gray-400">
                  Scanning for dates and times...
                </span>
              </div>
            </div>
          )}

          {/* Message Content */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Full Content
            </h3>
            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>

          {/* View Original Button */}
          {message.url && (
            <a
              href={message.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center inline-block"
            >
              🔗 View Original on{" "}
              {message.platform.charAt(0).toUpperCase() +
                message.platform.slice(1)}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModal;

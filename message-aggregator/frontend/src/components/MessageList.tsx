import React, { useState } from "react";
import MessageCard from "./MessageCard";
import MessageModal from "./MessageModal";
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
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  if (!messages) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">📬</div>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            No messages loaded yet
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Select platforms and click "Load Messages" to get started.
          </p>
        </div>
      </div>
    );
  }

  const important = messages.important || [];
  const regular = messages.regular || [];
  const allMessages = [...important, ...regular];
  const stats = messages.curation_stats;

  if (allMessages.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center animate-fade-in">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            No messages available
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Connect your accounts to start aggregating messages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-500 to-blue-600 bg-clip-text text-transparent mb-2">
          Your Messages
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {allMessages.length} total messages
          {messages.important_count && messages.important_count > 0 && (
            <span> • ⭐ {messages.important_count} important</span>
          )}
        </p>
      </div>

      {/* AI Curation Stats */}
      {stats && messages.curation_method === "hybrid" && (
        <div className="card p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-800 animate-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
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
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                🤖 AI-Powered Curation Active
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Using hybrid semantic + keyword matching
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-dark-card p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {(stats.avg_semantic_score! * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Semantic Match
              </div>
            </div>
            <div className="bg-white dark:bg-dark-card p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(stats.avg_tfidf_score! * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Keyword Match
              </div>
            </div>
            <div className="bg-white dark:bg-dark-card p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(stats.avg_hybrid_score! * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Overall Relevance
              </div>
            </div>
          </div>

          {stats.preferences_matched &&
            Object.keys(stats.preferences_matched).length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Matched Topics:
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.preferences_matched).map(
                    ([pref, count]) => (
                      <span
                        key={pref}
                        className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium"
                      >
                        {pref} ({count})
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Important Messages */}
      {important.length > 0 && (
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-300 dark:border-yellow-800">
            <div className="text-3xl">⭐</div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Important Messages ({important.length})
              </h2>
              {messages.preferences_used &&
                messages.preferences_used.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on: {messages.preferences_used.join(", ")}
                  </p>
                )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {important.map((message) => (
              <div key={message.id} className="relative">
                <div className="absolute -top-2 -left-2 z-10">
                  <div className="bg-yellow-400 text-yellow-900 rounded-full p-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <MessageCard
                  message={message}
                  onClick={() => setSelectedMessage(message)}
                />
                {message.hybrid_score && (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg flex items-center justify-between text-xs">
                    <div className="flex gap-3">
                      {message.semantic_score && (
                        <span className="text-gray-600 dark:text-gray-400">
                          🧠 {(message.semantic_score * 100).toFixed(0)}%
                        </span>
                      )}
                      {message.tfidf_score && (
                        <span className="text-gray-600 dark:text-gray-400">
                          🔑 {(message.tfidf_score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-yellow-700 dark:text-yellow-400">
                      Overall: {(message.hybrid_score * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular Messages */}
      {regular.length > 0 && (
        <div className="animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            All Messages ({regular.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {regular.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onClick={() => setSelectedMessage(message)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {selectedMessage && (
        <MessageModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
        />
      )}
    </div>
  );
};

export default MessageList;

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  timestamp: Date;
}

interface Source {
  platform: string;
  sender: string;
  title: string;
  timestamp: string;
  relevance_score: number;
  chat: string;
}

interface ChatAssistantProps {
  isIndexed: boolean;
  messageCount: number;
}

const platformColors: Record<string, string> = {
  gmail: "bg-red-100 text-red-700",
  telegram: "bg-blue-100 text-blue-700",
  twitter: "bg-sky-100 text-sky-700",
  reddit: "bg-orange-100 text-orange-700",
  slack: "bg-purple-100 text-purple-700",
  discord: "bg-indigo-100 text-indigo-700",
};

const SUGGESTIONS = [
  "Any job interview emails?",
  "Latest project updates?",
  "Important deadlines?",
];

const ChatAssistant: React.FC<ChatAssistantProps> = ({
  isIndexed,
  messageCount,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Please load your messages first, then I can answer questions about them.",
      sources: [],
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  // ← Update welcome message when indexing completes
  useEffect(() => {
    if (isIndexed) {
      setMessages([
        {
          id: "welcome-indexed",
          role: "assistant",
          content: `✅ I now have access to ${messageCount} of your messages! Ask me anything.\n\nTry: "Any messages from [name]?" or "Has my job interview email come?" or "What are the latest updates?"`,
          sources: [],
          timestamp: new Date(),
        },
      ]);
    } else {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content:
            "Please load your messages first, then I can answer questions about them.",
          sources: [],
          timestamp: new Date(),
        },
      ]);
    }
  }, [isIndexed, messageCount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleQuery = async () => {
    if (!input.trim() || loading || !isIndexed) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setLoading(true);

    try {
      const token = await getToken();
      const response = await fetch("http://localhost:8000/api/rag/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: currentInput }),
      });

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          sources: [],
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-blue-500
                   rounded-full shadow-lg flex items-center justify-center text-white text-2xl
                   hover:scale-110 transition-transform z-50"
        title="Ask AI about your messages"
      >
        {isOpen ? "✕" : "🤖"}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 w-96 h-[500px] bg-white dark:bg-gray-800
                      rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700
                      flex flex-col z-50 animate-slide-up"
        >
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-t-2xl">
            <h3 className="text-white font-bold text-lg">
              🤖 Message Assistant
            </h3>
            <p className="text-white/80 text-xs">
              {isIndexed
                ? `✅ Searching across ${messageCount} messages`
                : "⏳ Load messages to enable AI search"}
            </p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-sm"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        📎 Sources:
                      </p>
                      {msg.sources.map((src, i) => (
                        <div
                          key={i}
                          className={`text-xs px-2 py-1 rounded-lg mb-1 ${
                            platformColors[src.platform] ||
                            "bg-gray-200 text-gray-700"
                          }`}
                        >
                          <span className="font-semibold capitalize">
                            {src.platform}
                          </span>
                          {" · "}
                          {src.sender}
                          {src.title && ` · "${src.title.substring(0, 30)}..."`}
                          <span className="ml-1 opacity-60">
                            ({(src.relevance_score * 100).toFixed(0)}% match)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuery()}
                placeholder={
                  isIndexed
                    ? "Ask about your messages..."
                    : "Load messages first..."
                }
                disabled={!isIndexed || loading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600
                           rounded-xl bg-white dark:bg-gray-800 focus:outline-none
                           focus:ring-2 focus:ring-purple-400 disabled:opacity-50"
              />
              <button
                onClick={handleQuery}
                disabled={!isIndexed || loading || !input.trim()}
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white
                           rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity text-sm"
              >
                {loading ? "..." : "Ask"}
              </button>
            </div>

            {/* Suggested questions */}
            <div className="mt-2 flex flex-wrap gap-1">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInput(suggestion)}
                  disabled={!isIndexed}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600
                             dark:text-gray-400 rounded-full hover:bg-purple-100
                             hover:text-purple-700 transition-colors disabled:opacity-40"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;

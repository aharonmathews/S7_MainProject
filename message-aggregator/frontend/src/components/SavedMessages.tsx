import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { savedMessagesApi } from "../services/savedMessagesApi";
import MessageModal from "./MessageModal";

interface SavedMessage {
  id: string;
  message_id: string;
  platform: string;
  title: string;
  content: string;
  sender: string;
  timestamp: string;
  chat?: string;
  url?: string;
  saved_at: string;
  ai_scores?: any;
}

const PLATFORM_CFG: Record<string, { icon: string; bg: string; text: string }> =
  {
    telegram: {
      icon: "✈️",
      bg: "bg-sky-50 dark:bg-sky-900/20",
      text: "text-sky-600 dark:text-sky-400",
    },
    gmail: {
      icon: "✉️",
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-600 dark:text-red-400",
    },
    discord: {
      icon: "🎮",
      bg: "bg-indigo-50 dark:bg-indigo-900/20",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    reddit: {
      icon: "👾",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-600 dark:text-orange-400",
    },
    slack: {
      icon: "💬",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      text: "text-purple-600 dark:text-purple-400",
    },
    twitter: {
      icon: "𝕏",
      bg: "bg-slate-100 dark:bg-slate-800",
      text: "text-slate-700 dark:text-slate-300",
    },
  };

const SavedMessages: React.FC = () => {
  const [saved, setSaved] = useState<SavedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SavedMessage | null>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;
      const msgs = await savedMessagesApi.getSavedMessages(token);
      setSaved(msgs);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this message?")) return;
    const token = await getToken();
    if (!token) return;
    await savedMessagesApi.deleteSavedMessage(token, id);
    load();
    setSelected(null);
  };

  if (loading)
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading saved messages…</p>
        </div>
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Saved Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {saved.length} message{saved.length !== 1 ? "s" : ""} bookmarked
          </p>
        </div>
      </div>

      {saved.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl mx-auto mb-4">
            🔖
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Nothing saved yet
          </h2>
          <p className="text-sm text-slate-400">
            Open any message and click Save to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {saved.map((msg) => {
            const cfg = PLATFORM_CFG[msg.platform] ?? {
              icon: "📬",
              bg: "bg-slate-100",
              text: "text-slate-600",
            };
            return (
              <div
                key={msg.id}
                className="card card-hover p-5 flex gap-4"
                onClick={() => setSelected(msg)}
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-lg">
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {msg.title}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(msg.id);
                      }}
                      className="btn-danger shrink-0 py-1 px-2 text-xs"
                    >
                      🗑
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-1 mb-2">
                    <span
                      className={`platform-badge text-[11px] ${cfg.bg} ${cfg.text} capitalize`}
                    >
                      {msg.platform}
                    </span>
                    {msg.sender && (
                      <span className="text-xs text-slate-400">
                        👤 {msg.sender}
                      </span>
                    )}
                    {msg.chat && (
                      <span className="text-xs text-slate-400">
                        # {msg.chat}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {msg.content.slice(0, 180)}
                    {msg.content.length > 180 ? "…" : ""}
                  </p>

                  <div className="flex gap-4 mt-2 text-[11px] text-slate-400">
                    <span>
                      📅 {new Date(msg.timestamp).toLocaleDateString()}
                    </span>
                    <span>
                      🔖 Saved {new Date(msg.saved_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <MessageModal
          message={{
            id: selected.message_id,
            platform: selected.platform,
            title: selected.title,
            content: selected.content,
            sender: selected.sender,
            timestamp: selected.timestamp,
            chat: selected.chat,
            url: selected.url,
            ai_scores: selected.ai_scores,
          }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
};

export default SavedMessages;

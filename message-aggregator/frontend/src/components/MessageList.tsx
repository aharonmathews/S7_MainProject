import React, { useState } from "react";
import MessageCard from "./MessageCard";
import MessageModal from "./MessageModal";
import { Message } from "../types";

interface Props {
  messages?: {
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
  } | null;
}

const MessageList: React.FC<Props> = ({ messages }) => {
  const [selected, setSelected] = useState<Message | null>(null);

  /* Empty state */
  if (!messages || (!messages.important?.length && !messages.regular?.length)) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-4xl mb-6 shadow-inner">
          💌
        </div>
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
          {messages ? "No messages found" : "Nothing loaded yet"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          {messages
            ? "Connect your accounts and load messages to get started."
            : "Select platforms from the sidebar and click Load Messages."}
        </p>
      </div>
    );
  }

  const important = messages.important ?? [];
  const regular = messages.regular ?? [];
  const stats = messages.curation_stats;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Your Messages
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {important.length + regular.length} total
            {important.length > 0 && (
              <>
                {" "}
                ·{" "}
                <span className="text-amber-500 font-medium">
                  ★ {important.length} important
                </span>
              </>
            )}
          </p>
        </div>
        {messages.preferences_used && messages.preferences_used.length > 0 && (
          <div className="hidden sm:flex flex-wrap gap-1 justify-end max-w-xs">
            {messages.preferences_used.slice(0, 4).map((p) => (
              <span key={p} className="stat-pill">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* AI curation banner */}
      {stats && messages.curation_method === "hybrid" && (
        <div className="card p-5 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border border-violet-200 dark:border-violet-800/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-sm shrink-0">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                AI-Powered Curation Active
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hybrid semantic + keyword matching
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              {
                label: "Semantic",
                val: stats.avg_semantic_score,
                color: "text-violet-600 dark:text-violet-400",
              },
              {
                label: "Keyword",
                val: stats.avg_tfidf_score,
                color: "text-indigo-600 dark:text-indigo-400",
              },
              {
                label: "Overall",
                val: stats.avg_hybrid_score,
                color: "text-blue-600 dark:text-blue-400",
              },
            ].map((m) => (
              <div
                key={m.label}
                className="bg-white dark:bg-slate-900 rounded-xl p-3 text-center"
              >
                <div className={`text-xl font-bold ${m.color}`}>
                  {((m.val ?? 0) * 100).toFixed(1)}%
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {m.label}
                </div>
              </div>
            ))}
          </div>

          {stats.preferences_matched &&
            Object.keys(stats.preferences_matched).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(stats.preferences_matched).map(([k, v]) => (
                  <span
                    key={k}
                    className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium"
                  >
                    {k} ·{v}
                  </span>
                ))}
              </div>
            )}
        </div>
      )}

      {/* Important */}
      {important.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-amber-500 text-lg">★</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Important Messages
            </h2>
            <span className="stat-pill">{important.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {important.map((msg) => (
              <div key={msg.id} className="relative">
                <MessageCard message={msg} onClick={() => setSelected(msg)} />
                {msg.hybrid_score && (
                  <div className="absolute bottom-14 right-4 flex gap-2 text-[10px]">
                    {msg.semantic_score && (
                      <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                        S {(msg.semantic_score * 100).toFixed(0)}%
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold">
                      {(msg.hybrid_score * 100).toFixed(0)}% match
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Regular */}
      {regular.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              All Messages
            </h2>
            <span className="stat-pill">{regular.length}</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {regular.map((msg) => (
              <MessageCard
                key={msg.id}
                message={msg}
                onClick={() => setSelected(msg)}
              />
            ))}
          </div>
        </section>
      )}

      {selected && (
        <MessageModal message={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default MessageList;

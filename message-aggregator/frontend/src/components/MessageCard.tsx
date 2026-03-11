import React from "react";
import { Message } from "../types";

const PLATFORM_CFG: Record<
  string,
  { gradient: string; icon: string; bg: string; text: string }
> = {
  telegram: {
    gradient: "from-[#229ED9] to-[#1a7fc4]",
    icon: "✈️",
    bg: "bg-[#229ED9]/10 dark:bg-[#229ED9]/20",
    text: "text-[#229ED9]",
  },
  twitter: {
    gradient: "from-slate-700 to-slate-900",
    icon: "𝕏",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-700 dark:text-slate-300",
  },
  gmail: {
    gradient: "from-[#EA4335] to-[#c5221f]",
    icon: "✉️",
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-600 dark:text-red-400",
  },
  reddit: {
    gradient: "from-[#FF4500] to-[#cc3700]",
    icon: "👾",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
  },
  slack: {
    gradient: "from-[#4A154B] to-[#611f69]",
    icon: "💬",
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
  },
  discord: {
    gradient: "from-[#5865F2] to-[#4752c4]",
    icon: "🎮",
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-600 dark:text-indigo-400",
  },
};

interface Props {
  message: Message;
  onClick: () => void;
}

const MessageCard: React.FC<Props> = ({ message, onClick }) => {
  const cfg = PLATFORM_CFG[message.platform] ?? {
    gradient: "from-slate-500 to-slate-700",
    icon: "📬",
    bg: "bg-slate-100 dark:bg-slate-800",
    text: "text-slate-600",
  };

  const ts = new Date(message.timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const preview =
    message.content.length > 160
      ? message.content.slice(0, 160) + "…"
      : message.content;

  return (
    <div
      onClick={onClick}
      className="card card-hover p-5 group flex flex-col gap-3"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Platform dot */}
          <div
            className={`mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-white text-sm shrink-0`}
          >
            {cfg.icon}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
              {message.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span
                className={`platform-badge ${cfg.bg} ${cfg.text} capitalize`}
              >
                {message.platform}
              </span>
              {message.sender && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  👤 {message.sender}
                </span>
              )}
              {message.chat && (
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  # {message.chat}
                </span>
              )}
            </div>
          </div>
        </div>

        <span className="text-[11px] text-slate-400 dark:text-slate-600 shrink-0 pt-0.5 whitespace-nowrap">
          {ts}
        </span>
      </div>

      {/* Preview */}
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
        {preview}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-[11px] text-slate-400 italic">
          Click to expand
        </span>
        <span className="text-violet-500 group-hover:translate-x-0.5 transition-transform text-sm">
          →
        </span>
      </div>
    </div>
  );
};

export default MessageCard;

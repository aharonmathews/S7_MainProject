import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const ALL_PLATFORMS = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    description: "Telegram chats & channels",
    color: "from-[#229ED9] to-[#1a7fc4]",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: "𝕏",
    description: "Tweets & mentions",
    color: "from-slate-600 to-slate-800",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "✉️",
    description: "Email inbox",
    color: "from-[#EA4335] to-[#c5221f]",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: "👾",
    description: "Posts & comments",
    color: "from-[#FF4500] to-[#cc3700]",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    description: "Workspace messages",
    color: "from-[#4A154B] to-[#611f69]",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "🎮",
    description: "Server messages",
    color: "from-[#5865F2] to-[#4752c4]",
  },
];

interface Props {
  connectedServices: string[];
  onServicesChange: (services: string[]) => void;
}

const Dashboard: React.FC<Props> = ({
  connectedServices,
  onServicesChange,
}) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { user, getToken } = useAuth();

  const toggle = (id: string) => {
    const updated = connectedServices.includes(id)
      ? connectedServices.filter((s) => s !== id)
      : [...connectedServices, id];
    onServicesChange(updated);
    setSaved(false);
  };

  const saveServices = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await axios.post(
        "http://localhost:8000/user/services",
        { user_id: user?.uid, services: connectedServices },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your connected platforms
          </p>
        </div>
        <button
          onClick={saveServices}
          disabled={saving}
          className={`btn-primary flex items-center gap-2 ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {saving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : saved ? (
            <>
              <span>✅</span> Saved!
            </>
          ) : (
            <>
              <span>💾</span> Save Changes
            </>
          )}
        </button>
      </div>

      {/* Info banner */}
      <div className="card p-4 mb-6 bg-violet-50 dark:bg-violet-900/10 border-violet-200 dark:border-violet-800/40">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div>
            <p className="text-sm font-semibold text-violet-800 dark:text-violet-300">
              Connected Services
            </p>
            <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
              Only connected platforms appear in the sidebar. Toggle them on/off
              here — changes reflect instantly in the Messages view.
            </p>
          </div>
        </div>
      </div>

      {/* Platform grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_PLATFORMS.map((p) => {
          const isConnected = connectedServices.includes(p.id);
          return (
            <div
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`
                card card-hover p-5 flex flex-col gap-4 cursor-pointer
                ${
                  isConnected
                    ? "border-violet-200 dark:border-violet-800/60 bg-violet-50/50 dark:bg-violet-900/10"
                    : "opacity-60 hover:opacity-80"
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xl shadow-sm`}
                >
                  {p.icon}
                </div>
                {/* Toggle pill */}
                <div
                  className={`relative w-10 h-5 rounded-full transition-all duration-200 ${isConnected ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-700"}`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${isConnected ? "left-5" : "left-0.5"}`}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {p.description}
                </p>
              </div>

              <div
                className={`text-xs font-semibold flex items-center gap-1.5 ${isConnected ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-slate-400"}`}
                />
                {isConnected
                  ? "Connected · Visible in sidebar"
                  : "Not connected"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {ALL_PLATFORMS.filter((p) => connectedServices.includes(p.id)).map(
              (p) => (
                <div
                  key={p.id}
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center text-white text-xs border-2 border-white dark:border-[#111827]`}
                >
                  {p.icon}
                </div>
              ),
            )}
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
            {connectedServices.length} platform
            {connectedServices.length !== 1 ? "s" : ""} connected
          </p>
        </div>
        <p className="text-xs text-slate-400">
          Changes sync to sidebar instantly
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
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

const PREFERENCE_SUGGESTIONS = [
  "Job Opportunities",
  "Technology",
  "Machine Learning",
  "Business",
  "Study Materials",
  "Physics",
  "Climate Change",
  "Space Exploration",
  "Healthcare",
  "Finance",
  "AI & Robotics",
  "Entrepreneurship",
  "Programming",
  "Data Science",
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
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState("");
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const { user, getToken } = useAuth();

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        "http://localhost:8000/api/user/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data?.preferences) {
        setPreferences(response.data.preferences);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    } finally {
      setLoadingPrefs(false);
    }
  };

  const toggleService = (id: string) => {
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
        "http://localhost:8000/api/user/setup",
        {
          services: connectedServices,
          preferences: preferences,
          job: "",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving services:", error);
    } finally {
      setSaving(false);
    }
  };

  const addPreference = (pref?: string) => {
    const prefToAdd = pref || newPreference.trim();
    if (prefToAdd && !preferences.includes(prefToAdd)) {
      setPreferences([...preferences, prefToAdd]);
      setNewPreference("");
      setSaved(false);
    }
  };

  const removePreference = (pref: string) => {
    setPreferences(preferences.filter((p) => p !== pref));
    setSaved(false);
  };

  const savePreferences = async () => {
    if (preferences.length === 0) {
      alert("Please add at least one preference");
      return;
    }

    setSavingPrefs(true);
    try {
      const token = await getToken();
      await axios.put(
        "http://localhost:8000/api/user/preferences",
        { preferences },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in space-y-6">
      {/* ─── Section 1: PLATFORMS ─────────────────────────────────── */}
      <div>
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage your connected platforms and preferences
            </p>
          </div>
          <button
            onClick={saveServices}
            disabled={saving}
            className={`btn-primary flex items-center gap-2 ${
              saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
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
                Connected Platforms
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">
                Toggle platforms on/off below. Only connected platforms appear
                in the Messages view. Your preferences are used to rank
                messages.
              </p>
            </div>
          </div>
        </div>

        {/* Platform grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {ALL_PLATFORMS.map((p) => {
            const isConnected = connectedServices.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => toggleService(p.id)}
                className={`
                  card card-hover p-5 flex flex-col gap-3 cursor-pointer transition-all
                  ${
                    isConnected
                      ? "border-violet-300 dark:border-violet-600 bg-violet-50 dark:bg-violet-900/20 ring-2 ring-violet-200 dark:ring-violet-800"
                      : "opacity-60 hover:opacity-80"
                  }
                `}
              >
                {/* Checkbox & Icon */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className={`
                        w-6 h-6 rounded border-2 flex items-center justify-center
                        ${
                          isConnected
                            ? "bg-violet-500 border-violet-500"
                            : "border-slate-300 dark:border-slate-600"
                        }
                      `}
                    >
                      {isConnected && (
                        <span className="text-white text-sm">✓</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {p.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-2xl">{p.icon}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── DIVIDER ─────────────────────────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-slate-700" />

      {/* ─── Section 2: PREFERENCES ─────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          ⭐ Your Preferences
        </h2>

        {/* Info banner */}
        <div className="card p-4 mb-6 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/40">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🎯</span>
            <div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                What are preferences?
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                Preferences are topics you're interested in. Messages matching
                your preferences appear first in the home feed. Add as many as
                you want!
              </p>
            </div>
          </div>
        </div>

        {/* Add new preference */}
        <div className="card p-5 mb-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Add Custom Preference
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={newPreference}
              onChange={(e) => setNewPreference(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addPreference()}
              placeholder="e.g., Quantum Computing, Web3, Sustainability..."
              className="input flex-1"
            />
            <button
              onClick={() => addPreference()}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Quick suggestions */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Quick Suggestions
          </label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                onClick={() => addPreference(tag)}
                disabled={preferences.includes(tag)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all
                  ${
                    preferences.includes(tag)
                      ? "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-500 cursor-not-allowed"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-violet-500 hover:text-white"
                  }
                `}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Current preferences */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Your Preferences ({preferences.length})
          </label>
          {preferences.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {preferences.map((pref) => (
                <span
                  key={pref}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-full font-medium"
                >
                  {pref}
                  <button
                    onClick={() => removePreference(pref)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                    aria-label={`Remove ${pref}`}
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 italic">
              No preferences added yet. Add at least one!
            </p>
          )}
        </div>

        {/* Save preferences button */}
        <button
          onClick={savePreferences}
          disabled={savingPrefs || preferences.length === 0}
          className={`
            w-full btn-primary flex items-center justify-center gap-2
            ${
              savingPrefs || preferences.length === 0
                ? "opacity-50 cursor-not-allowed"
                : ""
            }
          `}
        >
          {savingPrefs ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving Preferences…
            </>
          ) : (
            <>
              <span>💾</span> Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

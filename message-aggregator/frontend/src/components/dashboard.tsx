import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [newPreference, setNewPreference] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        "http://localhost:8000/api/user/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setProfile(response.data);
      setPreferences(response.data.preferences || []);
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      if (error.response?.status === 404) {
        setError("Profile not found. Please complete setup.");
        setTimeout(() => navigate("/setup"), 2000);
      } else {
        setError("Failed to load profile");
      }
      setLoading(false);
    }
  };

  const handleAddPreference = () => {
    const trimmed = newPreference.trim();
    if (trimmed && !preferences.includes(trimmed)) {
      setPreferences([...preferences, trimmed]);
      setNewPreference("");
    }
  };

  const handleRemovePreference = (pref: string) => {
    setPreferences(preferences.filter((p) => p !== pref));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await axios.post(
        `http://localhost:8000/user/preferences?user_id=${user?.uid}`,
        preferences,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setProfile({ ...profile, preferences });
      setEditing(false);
      alert("✅ Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-primary-500 mx-auto mb-4"
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
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
            {error}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Redirecting to setup...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent mb-2">
          📊 Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile and preferences
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500 rounded-xl">
              <svg
                className="w-8 h-8 text-white"
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
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User Email
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-500 rounded-xl">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Connected Services
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {profile?.services?.length || 0} platforms
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-500 rounded-xl">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Preferences
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {preferences.length} topics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="card p-6 mb-6 animate-slide-up">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
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
              d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
            />
          </svg>
          Profile Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Email
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {user?.email}
            </p>
          </div>

          {profile.job && (
            <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Job/Role
              </p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {profile.job}
              </p>
            </div>
          )}

          <div className="p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Setup Status
            </p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {profile.setup_completed ? "✅ Completed" : "⏳ Pending"}
            </p>
          </div>
        </div>
      </div>

      {/* Connected Services */}
      {profile.services && profile.services.length > 0 && (
        <div className="card p-6 mb-6 animate-slide-up">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
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
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            Connected Services
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {profile.services.map((service: string) => (
              <div
                key={service}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-gray-800 rounded-lg text-center border-2 border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200"
              >
                <div className="text-3xl mb-2">
                  {service === "telegram"
                    ? "📱"
                    : service === "twitter"
                    ? "🐦"
                    : service === "gmail"
                    ? "📧"
                    : service === "reddit"
                    ? "🔶"
                    : service === "slack"
                    ? "💬"
                    : "🎮"}
                </div>
                <p className="font-semibold text-sm capitalize">{service}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preferences Management */}
      <div className="card p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
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
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
            Your Preferences
          </h2>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-6">
            {/* Add New Preference */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Add New Preference
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newPreference}
                  onChange={(e) => setNewPreference(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddPreference()}
                  className="input flex-1"
                  placeholder="e.g., Machine Learning, Climate Change..."
                />
                <button
                  onClick={handleAddPreference}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200"
                >
                  + Add
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Press Enter to add quickly
              </p>
            </div>

            {/* Current Preferences */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Current Preferences ({preferences.length})
              </label>
              {preferences.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {preferences.map((pref) => (
                    <span
                      key={pref}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-full font-medium text-sm group"
                    >
                      {pref}
                      <button
                        onClick={() => handleRemovePreference(pref)}
                        className="p-1 hover:bg-white/20 rounded-full transition-colors"
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
                <p className="text-gray-500 dark:text-gray-400 italic">
                  No preferences added yet
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setEditing(false);
                  setPreferences(profile.preferences || []);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className={`btn-primary ${
                  saving ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {saving ? "Saving..." : "💾 Save Preferences"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {preferences.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {preferences.map((pref) => (
                  <span
                    key={pref}
                    className="px-4 py-2 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-full font-medium text-sm"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                No preferences set yet
              </p>
            )}
          </div>
        )}
      </div>

      {/* Update Settings Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/setup")}
          className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-dark-card dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition-all duration-200 inline-flex items-center gap-2"
        >
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Update Services & Settings
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

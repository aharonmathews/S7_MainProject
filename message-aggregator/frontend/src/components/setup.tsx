import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const Setup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [newPreference, setNewPreference] = useState("");
  const [job, setJob] = useState("");
  const [loading, setLoading] = useState(true);
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  const services = [
    {
      id: "telegram",
      name: "Telegram",
      icon: "📱",
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: "🐦",
      color: "from-sky-400 to-blue-500",
    },
    {
      id: "gmail",
      name: "Gmail",
      icon: "📧",
      color: "from-red-500 to-pink-500",
    },
    {
      id: "reddit",
      name: "Reddit",
      icon: "🔶",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "slack",
      name: "Slack",
      icon: "💬",
      color: "from-purple-600 to-pink-500",
    },
    {
      id: "discord",
      name: "Discord",
      icon: "🎮",
      color: "from-indigo-500 to-purple-600",
    },
  ];

  const suggestionTags = [
    "Job Opportunities",
    "Technology",
    "Business",
    "Study Materials",
    "Physics",
    "Machine Learning",
    "Climate Change",
    "Space Exploration",
    "Healthcare",
    "Finance",
    "AI & Robotics",
    "Entrepreneurship",
  ];

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        "http://localhost:8000/api/user/profile",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        setSelectedServices(response.data.services || []);
        setPreferences(response.data.preferences || []);
        setJob(response.data.job || "");
      }
    } catch (error) {
      console.log("No existing profile found, starting fresh");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleAddPreference = (pref?: string) => {
    const prefToAdd = pref || newPreference.trim();
    if (prefToAdd && !preferences.includes(prefToAdd)) {
      setPreferences([...preferences, prefToAdd]);
      setNewPreference("");
    }
  };

  const handleRemovePreference = (pref: string) => {
    setPreferences(preferences.filter((p) => p !== pref));
  };

  const handleFinish = async () => {
    if (preferences.length === 0) {
      alert("Please add at least one preference");
      return;
    }

    try {
      const token = await getToken();
      await axios.post(
        "http://localhost:8000/api/user/setup",
        { services: selectedServices, preferences, job },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate("/");
    } catch (error) {
      console.error("Error saving setup:", error);
      alert("Failed to save setup. Please try again.");
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
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-blue-600 to-purple-600 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                    step >= s
                      ? "bg-white text-primary-600 scale-110"
                      : "bg-white/30 text-white"
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 w-24 md:w-40 mx-2 transition-all duration-300 ${
                      step > s ? "bg-white" : "bg-white/30"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-white text-center text-sm">Step {step} of 3</p>
        </div>

        {/* Card */}
        <div className="card p-8 backdrop-blur-sm bg-white/95 dark:bg-dark-card/95 animate-slide-up">
          {/* Step 1: Select Services */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                📱 Select Services
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose which platforms you want to aggregate messages from
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className={`card card-hover p-6 cursor-pointer transition-all duration-200 ${
                      selectedServices.includes(service.id)
                        ? "ring-4 ring-primary-500 bg-primary-50 dark:bg-primary-900/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="w-6 h-6 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <div
                        className={`text-4xl p-3 rounded-xl bg-gradient-to-r ${service.color}`}
                      >
                        <span className="filter drop-shadow-lg">
                          {service.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                          {service.name}
                        </p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={selectedServices.length === 0}
                className={`w-full btn-primary ${
                  selectedServices.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                Next: Set Preferences →
              </button>
            </div>
          )}

          {/* Step 2: Skip (Credentials are pre-configured) */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                ⚙️ Configuration
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Services are pre-configured and ready to use!
              </p>

              <div className="p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-300 dark:border-green-700 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
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
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-300">
                    All Set!
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-400">
                  Your selected services are configured and ready to aggregate
                  messages.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-primary flex-1"
                >
                  Next: Preferences →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Set Preferences */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                ⭐ Set Your Preferences
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Add topics you're interested in to personalize your message feed
              </p>

              {/* Add Preference */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  Add Custom Preference
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleAddPreference()
                    }
                    className="input flex-1"
                    placeholder="e.g., Quantum Computing, Sustainable Energy..."
                  />
                  <button
                    onClick={() => handleAddPreference()}
                    className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors duration-200"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Quick Suggestions */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Quick Suggestions
                </label>
                <div className="flex flex-wrap gap-2">
                  {suggestionTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => handleAddPreference(tag)}
                      disabled={preferences.includes(tag)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        preferences.includes(tag)
                          ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                          : "bg-gray-200 dark:bg-dark-border hover:bg-primary-500 hover:text-white"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Preferences */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-3">
                  Your Preferences ({preferences.length})
                </label>
                {preferences.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {preferences.map((pref) => (
                      <span
                        key={pref}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-500 to-blue-600 text-white rounded-full font-medium"
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
                    No preferences added yet. Add at least one to continue.
                  </p>
                )}
              </div>

              {/* Job Field */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2">
                  Job/Role (Optional)
                </label>
                <input
                  type="text"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="input"
                  placeholder="e.g., Software Engineer, Student, Researcher..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setStep(2)}
                  className="btn-secondary flex-1"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={preferences.length === 0}
                  className={`btn-primary flex-1 ${
                    preferences.length === 0
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  🎉 Complete Setup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;

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
  const [credentials, setCredentials] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { getToken, user } = useAuth();
  const navigate = useNavigate();

  const services = ["telegram", "twitter", "gmail", "reddit", "slack"];

  // Preset suggestions (optional)
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPreference();
    }
  };

  const handleCredentialChange = (
    service: string,
    field: string,
    value: string
  ) => {
    setCredentials((prev: any) => ({
      ...prev,
      [service]: { ...prev[service], [field]: value },
    }));
  };

  const handleFinish = async () => {
    if (preferences.length === 0) {
      alert("Please add at least one preference");
      return;
    }

    try {
      const token = await getToken();

      // Save user setup
      await axios.post(
        "http://localhost:8000/api/user/setup",
        {
          services: selectedServices,
          preferences,
          job,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Save credentials for each service
      for (const service of selectedServices) {
        if (credentials[service]) {
          await axios.post(
            "http://localhost:8000/api/user/credentials",
            {
              platform: service,
              credentials: credentials[service],
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }

      navigate("/");
    } catch (error) {
      console.error("Error saving setup:", error);
      alert("Failed to save setup. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Welcome! Let's set up your account</h1>
      <p style={{ color: "#666", marginBottom: "30px" }}>Step {step} of 3</p>

      {step === 1 && (
        <div>
          <h2>Select Services</h2>
          <p>Choose which platforms you want to aggregate messages from:</p>
          {services.map((service) => (
            <label key={service} style={{ display: "block", margin: "10px 0" }}>
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => handleServiceToggle(service)}
              />
              {" " + service.charAt(0).toUpperCase() + service.slice(1)}
            </label>
          ))}
          <button
            onClick={() => setStep(2)}
            disabled={selectedServices.length === 0}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              backgroundColor: selectedServices.length > 0 ? "#007bff" : "#ccc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: selectedServices.length > 0 ? "pointer" : "not-allowed",
            }}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Configure Service Credentials</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Note: Most services are pre-configured. You can skip this step.
          </p>

          {selectedServices.includes("telegram") && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Telegram (Optional)</h3>
              <input
                placeholder="API ID"
                value={credentials.telegram?.api_id || ""}
                onChange={(e) =>
                  handleCredentialChange("telegram", "api_id", e.target.value)
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
              <input
                placeholder="API Hash"
                value={credentials.telegram?.api_hash || ""}
                onChange={(e) =>
                  handleCredentialChange("telegram", "api_hash", e.target.value)
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
              <input
                placeholder="Phone Number"
                value={credentials.telegram?.phone || ""}
                onChange={(e) =>
                  handleCredentialChange("telegram", "phone", e.target.value)
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            style={{ marginRight: "10px", padding: "10px 20px" }}
          >
            Back
          </button>
          <button
            onClick={() => setStep(3)}
            style={{
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Set Your Preferences</h2>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Add topics you're interested in. You can add anything!
          </p>

          {/* Add Custom Preference */}
          <div
            style={{
              marginBottom: "25px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
            }}
          >
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              Add Your Own Preference:
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={newPreference}
                onChange={(e) => setNewPreference(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type anything (e.g., Artificial Intelligence, Cooking, Sports...)"
                style={{
                  flex: 1,
                  padding: "10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                }}
              />
              <button
                onClick={() => handleAddPreference()}
                disabled={!newPreference.trim()}
                style={{
                  padding: "10px 20px",
                  backgroundColor: newPreference.trim() ? "#28a745" : "#ccc",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: newPreference.trim() ? "pointer" : "not-allowed",
                }}
              >
                + Add
              </button>
            </div>
            <small
              style={{ color: "#666", display: "block", marginTop: "5px" }}
            >
              Press Enter to add quickly
            </small>
          </div>

          {/* Quick Suggestions */}
          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              Or pick from popular topics:
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {suggestionTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddPreference(tag)}
                  disabled={preferences.includes(tag)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: preferences.includes(tag)
                      ? "#ccc"
                      : "#e3f2fd",
                    color: preferences.includes(tag) ? "#666" : "#1976d2",
                    border: "1px solid #2196f3",
                    borderRadius: "16px",
                    cursor: preferences.includes(tag)
                      ? "not-allowed"
                      : "pointer",
                    fontSize: "13px",
                  }}
                >
                  {preferences.includes(tag) ? "✓ " : "+ "}
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Current Preferences */}
          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "bold",
              }}
            >
              Your Selected Preferences ({preferences.length}):
            </label>
            {preferences.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {preferences.map((pref) => (
                  <span
                    key={pref}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "20px",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {pref}
                    <button
                      onClick={() => handleRemovePreference(pref)}
                      style={{
                        background: "rgba(255,255,255,0.3)",
                        border: "none",
                        color: "white",
                        borderRadius: "50%",
                        width: "20px",
                        height: "20px",
                        cursor: "pointer",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#999" }}>
                No preferences added yet. Add some above!
              </p>
            )}
          </div>

          {/* Job Field */}
          <div style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "bold",
              }}
            >
              Your Job/Field (optional):
            </label>
            <input
              type="text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="e.g., Software Engineer, Student, Researcher..."
              style={{
                display: "block",
                padding: "10px",
                width: "100%",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setStep(2)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={preferences.length === 0}
              style={{
                padding: "10px 20px",
                backgroundColor: preferences.length > 0 ? "#28a745" : "#ccc",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: preferences.length > 0 ? "pointer" : "not-allowed",
              }}
            >
              {preferences.length === 0
                ? "Add at least 1 preference"
                : "🎉 Finish Setup"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Setup;

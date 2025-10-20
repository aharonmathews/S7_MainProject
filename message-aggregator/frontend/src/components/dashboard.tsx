import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
      alert("Preferences saved successfully!");
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPreference();
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Loading your dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "red" }}>
        <h2>{error}</h2>
        <p>Redirecting to setup...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>No profile found</h2>
        <button onClick={() => navigate("/setup")}>Complete Setup</button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Dashboard</h1>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Profile Information</h2>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        {profile.job && (
          <p>
            <strong>Job:</strong> {profile.job}
          </p>
        )}
        <p>
          <strong>Setup Completed:</strong>{" "}
          {profile.setup_completed ? "✅ Yes" : "❌ No"}
        </p>
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "20px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h2>Connected Services</h2>
        {profile.services && profile.services.length > 0 ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {profile.services.map((service: string) => (
              <li key={service} style={{ padding: "8px 0" }}>
                ✓ {service.charAt(0).toUpperCase() + service.slice(1)}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "#999" }}>No services connected yet</p>
        )}
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "15px",
          }}
        >
          <h2 style={{ margin: 0 }}>Your Preferences</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              ✏️ Edit Preferences
            </button>
          )}
        </div>

        {editing ? (
          <div>
            {/* Add New Preference */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                }}
              >
                Add New Preference:
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <input
                  type="text"
                  value={newPreference}
                  onChange={(e) => setNewPreference(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., Machine Learning, Climate Change, Space..."
                  style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    fontSize: "14px",
                  }}
                />
                <button
                  onClick={handleAddPreference}
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

            {/* Current Preferences */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                Current Preferences:
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

            {/* Action Buttons */}
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                gap: "10px",
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => {
                  setPreferences(profile.preferences || []);
                  setEditing(false);
                  setNewPreference("");
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                disabled={saving || preferences.length === 0}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    saving || preferences.length === 0 ? "#ccc" : "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor:
                    saving || preferences.length === 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {saving ? "Saving..." : "💾 Save Preferences"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {preferences.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {preferences.map((pref) => (
                  <span
                    key={pref}
                    style={{
                      backgroundColor: "#007bff",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "20px",
                      fontSize: "14px",
                    }}
                  >
                    {pref}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "#999" }}>No preferences set yet</p>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/setup")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          ⚙️ Update Services & Settings
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

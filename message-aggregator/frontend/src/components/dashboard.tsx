import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setLoading(false);
    } catch (error: any) {
      console.error("Error loading profile:", error);
      if (error.response?.status === 404) {
        // Profile doesn't exist, redirect to setup
        setError("Profile not found. Please complete setup.");
        setTimeout(() => navigate("/setup"), 2000);
      } else {
        setError("Failed to load profile");
      }
      setLoading(false);
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
        <h2>Your Preferences</h2>
        {profile.preferences && profile.preferences.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
            {profile.preferences.map((pref: string) => (
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

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          onClick={() => navigate("/setup")}
          style={{
            padding: "10px 20px",
            backgroundColor: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Update Preferences
        </button>
      </div>
    </div>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Setup from "./components/Setup";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import MessageList from "./components/MessageList";
import { fetchMessages } from "./services/api";
import { Message } from "./types";
import axios from "axios";

const MainApp: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [twitterKeyword, setTwitterKeyword] = useState("python");
  const [gmailAuthenticated, setGmailAuthenticated] = useState(false);
  const { user, logout, getToken } = useAuth();

  useEffect(() => {
    if (user) {
      checkGmailAuth();
    }
  }, [user]);

  const checkGmailAuth = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        "http://localhost:8000/auth/gmail/status",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGmailAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error("Error checking Gmail auth:", error);
    }
  };

  const handleGmailAuth = async () => {
    try {
      const token = await getToken();
      const response = await axios.get("http://localhost:8000/auth/gmail", {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error("Error initiating Gmail auth:", error);
    }
  };

  const loadMessages = async () => {
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const data = await fetchMessages(
        selectedPlatforms,
        twitterKeyword,
        token || ""
      );
      setMessages(data);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setError(error.message || "Failed to fetch messages");
    }
    setLoading(false);
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div
        style={{
          width: "280px",
          padding: "20px",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
        }}
      >
        <h2>Message Aggregator</h2>
        <div style={{ marginBottom: "20px" }}>
          <small>{user?.email}</small>
          <button
            onClick={() => logout()}
            style={{
              display: "block",
              marginTop: "5px",
              padding: "5px 10px",
              fontSize: "12px",
            }}
          >
            Logout
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <a href="/">Messages</a>
          </li>
          <li>
            <a href="/dashboard">Dashboard</a>
          </li>
          <li>Settings</li>
        </ul>

        <div style={{ marginTop: "30px" }}>
          <h3>Select Platforms:</h3>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={selectedPlatforms.includes("telegram")}
              onChange={() => handlePlatformToggle("telegram")}
            />
            {" Telegram"}
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={selectedPlatforms.includes("twitter")}
              onChange={() => handlePlatformToggle("twitter")}
            />
            {" Twitter (X)"}
            <span style={{ fontSize: "10px", color: "#999" }}>
              {" "}
              (API limits)
            </span>
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={selectedPlatforms.includes("gmail")}
              onChange={() => handlePlatformToggle("gmail")}
              disabled={!gmailAuthenticated}
            />
            {" Gmail"}
            {!gmailAuthenticated && (
              <button
                onClick={handleGmailAuth}
                style={{
                  marginLeft: "10px",
                  padding: "2px 8px",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
              >
                Connect
              </button>
            )}
          </label>
        </div>

        {selectedPlatforms.includes("twitter") && (
          <div style={{ marginTop: "20px" }}>
            <h3>Twitter Keyword:</h3>
            <input
              type="text"
              value={twitterKeyword}
              onChange={(e) => setTwitterKeyword(e.target.value)}
              style={{ width: "100%", padding: "5px" }}
            />
          </div>
        )}

        <button
          onClick={loadMessages}
          style={{
            marginTop: "20px",
            padding: "10px 20px",
            cursor: "pointer",
            width: "100%",
          }}
          disabled={loading || selectedPlatforms.length === 0}
        >
          {loading ? "Loading..." : "Load Messages"}
        </button>

        {error && (
          <div style={{ marginTop: "10px", color: "red", fontSize: "12px" }}>
            {error}
          </div>
        )}
      </div>

      <main style={{ flex: 1, overflow: "auto" }}>
        <Routes>
          <Route path="/" element={<MessageList messages={messages} />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/setup"
            element={
              <ProtectedRoute>
                <Setup />
              </ProtectedRoute>
            }
          />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;

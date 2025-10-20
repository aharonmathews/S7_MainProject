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
  const [messagesData, setMessagesData] = useState<any>({
    important: [],
    regular: [],
    total_count: 0,
    important_count: 0,
    preferences_used: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [twitterKeyword, setTwitterKeyword] = useState("python");
  const [redditKeyword, setRedditKeyword] = useState("technology");
  const [redditSubreddit, setRedditSubreddit] = useState("all");
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
      const response = await axios.get("http://localhost:8000/messages", {
        params: {
          platforms: selectedPlatforms.join(","),
          twitter_keyword: twitterKeyword,
          reddit_keyword: redditKeyword,
          reddit_subreddit: redditSubreddit,
          limit: 20,
          filter_by_preferences: true,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Received data:", response.data);
      setMessagesData(response.data);
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
          width: "300px",
          padding: "20px",
          borderRight: "1px solid #ccc",
          overflowY: "auto",
          backgroundColor: "#f8f9fa",
        }}
      >
        <h2>Message Aggregator</h2>
        <div
          style={{
            marginBottom: "20px",
            padding: "10px",
            backgroundColor: "white",
            borderRadius: "8px",
          }}
        >
          <small
            style={{ display: "block", marginBottom: "5px", color: "#666" }}
          >
            Logged in as:
          </small>
          <small
            style={{
              display: "block",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {user?.email}
          </small>
          <button
            onClick={() => logout()}
            style={{
              width: "100%",
              padding: "8px",
              fontSize: "12px",
              backgroundColor: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px" }}>
          <li style={{ marginBottom: "10px" }}>
            <a href="/" style={{ textDecoration: "none", color: "#007bff" }}>
              📬 Messages
            </a>
          </li>
          <li style={{ marginBottom: "10px" }}>
            <a
              href="/dashboard"
              style={{ textDecoration: "none", color: "#007bff" }}
            >
              📊 Dashboard
            </a>
          </li>
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

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={selectedPlatforms.includes("reddit")}
              onChange={() => handlePlatformToggle("reddit")}
            />
            {" Reddit"}
          </label>

          <label style={{ display: "block", marginBottom: "10px" }}>
            <input
              type="checkbox"
              checked={selectedPlatforms.includes("slack")}
              onChange={() => handlePlatformToggle("slack")}
            />
            {" Slack"}
          </label>
        </div>

        {selectedPlatforms.includes("twitter") && (
          <div style={{ marginTop: "20px" }}>
            <h4>Twitter Keyword:</h4>
            <input
              type="text"
              value={twitterKeyword}
              onChange={(e) => setTwitterKeyword(e.target.value)}
              style={{ width: "100%", padding: "5px" }}
            />
          </div>
        )}

        {selectedPlatforms.includes("reddit") && (
          <div style={{ marginTop: "20px" }}>
            <h4>Reddit Settings:</h4>
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "12px",
              }}
            >
              Keyword:
            </label>
            <input
              type="text"
              value={redditKeyword}
              onChange={(e) => setRedditKeyword(e.target.value)}
              placeholder="e.g., technology, python"
              style={{ width: "100%", padding: "5px", marginBottom: "10px" }}
            />
            <label
              style={{
                display: "block",
                marginBottom: "5px",
                fontSize: "12px",
              }}
            >
              Subreddit:
            </label>
            <input
              type="text"
              value={redditSubreddit}
              onChange={(e) => setRedditSubreddit(e.target.value)}
              placeholder="e.g., all, programming"
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
            backgroundColor: selectedPlatforms.length > 0 ? "#007bff" : "#ccc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
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

      <main style={{ flex: 1, overflow: "auto", backgroundColor: "#ffffff" }}>
        <Routes>
          <Route path="/" element={<MessageList messages={messagesData} />} />
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

import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MessageList from "./components/MessageList";
import { fetchMessages } from "./services/api";
import { Message } from "./types";

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "telegram",
    "twitter",
  ]);
  const [twitterKeyword, setTwitterKeyword] = useState("python");

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching messages...", selectedPlatforms, twitterKeyword);
      const data = await fetchMessages(selectedPlatforms, twitterKeyword);
      console.log("Messages received:", data);
      setMessages(data);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setError(error.message || "Failed to fetch messages");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <Router>
      <div style={{ display: "flex", height: "100vh" }}>
        <div
          style={{
            width: "230px",
            padding: "20px",
            borderRight: "1px solid #ccc",
          }}
        >
          <h2>Message Aggregator</h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>Messages</li>
            <li>Platforms</li>
            <li>Settings</li>
          </ul>

          <div style={{ marginTop: "30px" }}>
            <h3>Select Platforms:</h3>
            {["telegram", "twitter"].map((platform) => (
              <label
                key={platform}
                style={{ display: "block", marginBottom: "10px" }}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.includes(platform)}
                  onChange={() => handlePlatformToggle(platform)}
                />
                {" " + platform.charAt(0).toUpperCase() + platform.slice(1)}
              </label>
            ))}
          </div>

          <div style={{ marginTop: "20px" }}>
            <h3>Twitter Keyword:</h3>
            <input
              type="text"
              value={twitterKeyword}
              onChange={(e) => setTwitterKeyword(e.target.value)}
              style={{ width: "100%", padding: "5px" }}
            />
          </div>

          <button
            onClick={loadMessages}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              cursor: "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Messages"}
          </button>

          {error && (
            <div style={{ marginTop: "10px", color: "red", fontSize: "12px" }}>
              Error: {error}
            </div>
          )}
        </div>

        <main style={{ flex: 1, overflow: "auto" }}>
          <Routes>
            <Route path="/" element={<MessageList messages={messages} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;

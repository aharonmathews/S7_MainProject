import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./components/Login";
import Setup from "./components/Setup";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import MessageList from "./components/MessageList";
import Calendar from "./components/Calendar";
import SavedMessages from "./components/SavedMessages";
import ThemeToggle from "./components/ThemeToggle";
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout, getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const platforms = [
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

  useEffect(() => {
    if (user) checkGmailAuth();
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("gmail") === "success") {
      setGmailAuthenticated(true);
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  const checkGmailAuth = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:8000/auth/gmail/status?user_id=${user?.uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGmailAuthenticated(response.data.authenticated);
    } catch (error) {
      console.error("Error checking Gmail auth:", error);
    }
  };

  const handleGmailAuth = async () => {
    try {
      if (!user) {
        alert("Please log in first");
        return;
      }
      const token = await getToken();
      const response = await axios.get(
        `http://localhost:8000/auth/gmail?user_id=${user.uid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
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
          user_id: user?.uid,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessagesData(response.data);
    } catch (error: any) {
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

  const navLinks = [
    { path: "/", name: "Messages", icon: "📬" },
    { path: "/calendar", name: "Calendar", icon: "📅" },
    { path: "/saved", name: "Saved", icon: "💾" },
    { path: "/dashboard", name: "Dashboard", icon: "📊" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-dark-bg">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-80" : "w-20"
        } bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-blue-600 bg-clip-text text-transparent animate-fade-in">
                MessageHub
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
            >
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
                  d={
                    sidebarOpen
                      ? "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                      : "M13 5l7 7-7 7M5 5l7 7-7 7"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarOpen && (
            <>
              {/* User Info */}
              <div className="mb-6 p-4 card animate-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Logged in as
                  </span>
                  <ThemeToggle />
                </div>
                <p className="font-semibold truncate mb-3">{user?.email}</p>
                <button
                  onClick={() => logout()}
                  className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200 font-medium"
                >
                  Logout
                </button>
              </div>

              {/* Navigation */}
              <nav className="space-y-2 mb-6">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      location.pathname === link.path
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold"
                        : "hover:bg-gray-100 dark:hover:bg-dark-bg"
                    }`}
                  >
                    <span className="text-2xl">{link.icon}</span>
                    <span>{link.name}</span>
                  </button>
                ))}
              </nav>

              {/* Platform Selection */}
              <div className="mb-6">
                <h3 className="font-bold mb-3 text-lg">Select Platforms</h3>
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <label
                      key={platform.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedPlatforms.includes(platform.id)
                          ? "bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500"
                          : "hover:bg-gray-100 dark:hover:bg-dark-bg"
                      } ${
                        platform.id === "gmail" && !gmailAuthenticated
                          ? "opacity-50"
                          : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.includes(platform.id)}
                        onChange={() => handlePlatformToggle(platform.id)}
                        disabled={
                          platform.id === "gmail" && !gmailAuthenticated
                        }
                        className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-xl">{platform.icon}</span>
                      <span className="font-medium">{platform.name}</span>
                      {platform.id === "gmail" && gmailAuthenticated && (
                        <span className="ml-auto text-green-500 text-sm">
                          ✓ Connected
                        </span>
                      )}
                    </label>
                  ))}
                </div>
                {!gmailAuthenticated && (
                  <button
                    onClick={handleGmailAuth}
                    className="w-full mt-3 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    Connect Gmail
                  </button>
                )}
              </div>

              {/* Keywords */}
              {selectedPlatforms.includes("twitter") && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Twitter Keyword
                  </label>
                  <input
                    type="text"
                    value={twitterKeyword}
                    onChange={(e) => setTwitterKeyword(e.target.value)}
                    className="input text-sm"
                    placeholder="e.g., technology"
                  />
                </div>
              )}

              {selectedPlatforms.includes("reddit") && (
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Reddit Keyword
                    </label>
                    <input
                      type="text"
                      value={redditKeyword}
                      onChange={(e) => setRedditKeyword(e.target.value)}
                      className="input text-sm"
                      placeholder="e.g., python"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Subreddit
                    </label>
                    <input
                      type="text"
                      value={redditSubreddit}
                      onChange={(e) => setRedditSubreddit(e.target.value)}
                      className="input text-sm"
                      placeholder="e.g., all"
                    />
                  </div>
                </div>
              )}

              {/* Load Button */}
              <button
                onClick={loadMessages}
                disabled={loading || selectedPlatforms.length === 0}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-all duration-200 ${
                  loading || selectedPlatforms.length === 0
                    ? "bg-gray-300 dark:bg-gray-700 cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    Loading...
                  </span>
                ) : (
                  "🚀 Load Messages"
                )}
              </button>

              {error && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<MessageList messages={messagesData} />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/saved" element={<SavedMessages />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
};

export default App;

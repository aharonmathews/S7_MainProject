import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Login from "./components/login";
import Setup from "./components/setup";
import MessageList from "./components/MessageList";
import Calendar from "./components/calendar";
import SavedMessages from "./components/SavedMessages";
import Dashboard from "./components/dashboard";
import ProtectedRoute from "./components/protectedroute";
import ThemeToggle from "./components/ThemeToggle";
import ChatAssistant from "./components/ChatAssistant";

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
  const [ragIndexed, setRagIndexed] = useState(false);
  const [ragMessageCount, setRagMessageCount] = useState(0);
  const [cacheInfo, setCacheInfo] = useState<Record<string, any>>({});
  const [platformsFetchedFresh, setPlatformsFetchedFresh] = useState<string[]>(
    [],
  );

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
        { headers: { Authorization: `Bearer ${token}` } },
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
        { headers: { Authorization: `Bearer ${token}` } },
      );
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error("Error initiating Gmail auth:", error);
    }
  };

  const indexMessagesForRAG = async (data: any) => {
    // ← Guard: don't re-index if already indexed
    if (ragIndexed) {
      console.log("⚡ RAG already indexed, skipping...");
      return;
    }

    try {
      const token = await getToken();

      // ← Send top important messages first, then fill up with regular messages (max 20)
      const maxMessagesToIndex = 20;
      const importantMessages = data.important || [];
      const regularMessages = data.regular || [];

      let messagesToIndex = [...importantMessages];
      if (messagesToIndex.length < maxMessagesToIndex) {
        messagesToIndex = [
          ...messagesToIndex,
          ...regularMessages.slice(
            0,
            maxMessagesToIndex - messagesToIndex.length,
          ),
        ];
      } else {
        messagesToIndex = messagesToIndex.slice(0, maxMessagesToIndex);
      }

      if (messagesToIndex.length === 0) {
        console.log("⚠️ No messages to index for RAG");
        return;
      }

      console.log(`🤖 Indexing ${messagesToIndex.length} messages for RAG...`);

      const response = await fetch("http://localhost:8000/api/rag/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // ← Send the combined messages list as regular/important based on what we actually send
        body: JSON.stringify({
          messages: {
            important: importantMessages.filter((m) =>
              messagesToIndex.includes(m),
            ),
            regular: regularMessages.filter((m) => messagesToIndex.includes(m)),
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("❌ RAG index failed:", err);
        return;
      }

      const result = await response.json();
      console.log(`✅ RAG indexed: ${result.message_count} messages`);

      setRagIndexed(true);
      setRagMessageCount(messagesToIndex.length);
    } catch (e) {
      console.error("RAG indexing failed:", e);
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

      // ← Store cache info from response
      if (response.data.cache_info) {
        setCacheInfo(response.data.cache_info);
      }
      if (response.data.platforms_fetched_fresh) {
        setPlatformsFetchedFresh(response.data.platforms_fetched_fresh);
      }

      if (!ragIndexed) {
        await indexMessagesForRAG(response.data);
      }
    } catch (error: any) {
      setError(error.message || "Failed to fetch messages");
    }
    setLoading(false);
  };

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform],
    );
  };

  const handleForceRefresh = async (platformId: string) => {
    try {
      const token = await getToken();
      await fetch(`http://localhost:8000/api/cache/${platformId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Re-fetch just that platform
      alert(
        `Cache cleared for ${platformId}. Click Load Messages to fetch fresh data.`,
      );
    } catch (e) {
      console.error("Failed to clear cache:", e);
    }
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
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary-500 to-blue-600 bg-clip-text text-transparent">
                MessageHub
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
            >
              {sidebarOpen ? "«" : "»"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {sidebarOpen && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="p-3 bg-gray-50 dark:bg-dark-bg rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Logged in as
                </p>
                <p className="text-sm font-medium truncate">{user?.email}</p>
                <div className="flex items-center justify-between mt-2">
                  <ThemeToggle />
                  <button
                    onClick={logout}
                    className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      location.pathname === link.path
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium"
                        : "hover:bg-gray-100 dark:hover:bg-dark-bg text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.name}</span>
                  </button>
                ))}
              </nav>

              {/* Platform Selector */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Select Platforms
                </h3>
                <div className="space-y-2">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="relative">
                      <button
                        onClick={() => handlePlatformToggle(platform.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border transition-all ${
                          selectedPlatforms.includes(platform.id)
                            ? `bg-gradient-to-r ${platform.color} text-white border-transparent`
                            : "border-gray-200 dark:border-dark-border hover:border-gray-300"
                        }`}
                      >
                        <span>{platform.icon}</span>
                        <span className="text-sm font-medium flex-1 text-left">
                          {platform.name}
                        </span>
                        {selectedPlatforms.includes(platform.id) && (
                          <span>✓</span>
                        )}
                      </button>
                      // Cache status badge
                      {cacheInfo[platform.id] && (
                        <div className="mt-1 flex items-center justify-between px-1">
                          {cacheInfo[platform.id].is_fresh ? (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              ⚡ Cached ({cacheInfo[platform.id].expires_in}m
                              left)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {cacheInfo[platform.id].minutes_old}m old
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleForceRefresh(platform.id);
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 underline"
                            title="Force refresh"
                          >
                            refresh
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gmail Connect */}
              {selectedPlatforms.includes("gmail") && (
                <button
                  onClick={handleGmailAuth}
                  className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    gmailAuthenticated
                      ? "bg-green-100 text-green-700 dark:bg-green-900/20"
                      : "bg-red-100 text-red-700 dark:bg-red-900/20 hover:bg-red-200"
                  }`}
                >
                  {gmailAuthenticated
                    ? "✅ Gmail Connected"
                    : "📧 Connect Gmail"}
                </button>
              )}

              {/* Load Messages Button */}
              <button
                onClick={loadMessages}
                disabled={loading || selectedPlatforms.length === 0}
                className={`w-full btn-primary ${
                  loading || selectedPlatforms.length === 0
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "🚀 Load Messages"
                )}
              </button>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {/* RAG Status indicator */}
              {ragIndexed && (
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    🤖 AI Assistant ready ({ragMessageCount} msgs indexed)
                  </p>
                </div>
              )}
            </div>
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

      {/* ← ChatAssistant floating button - always visible */}
      <ChatAssistant isIndexed={ragIndexed} messageCount={ragMessageCount} />
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

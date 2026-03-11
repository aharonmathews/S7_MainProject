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

/* ─── All possible platforms ──────────────────────────────── */
const ALL_PLATFORMS = [
  {
    id: "telegram",
    name: "Telegram",
    icon: "✈️",
    color: "from-[#229ED9] to-[#1a7fc4]",
  },
  {
    id: "twitter",
    name: "Twitter",
    icon: "𝕏",
    color: "from-slate-600  to-slate-800",
  },
  {
    id: "gmail",
    name: "Gmail",
    icon: "✉️",
    color: "from-[#EA4335] to-[#c5221f]",
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: "👾",
    color: "from-[#FF4500] to-[#cc3700]",
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    color: "from-[#4A154B] to-[#611f69]",
  },
  {
    id: "discord",
    name: "Discord",
    icon: "🎮",
    color: "from-[#5865F2] to-[#4752c4]",
  },
];

const NAV = [
  { path: "/", name: "Messages", icon: "💌" },
  { path: "/calendar", name: "Calendar", icon: "📅" },
  { path: "/saved", name: "Saved", icon: "🔖" },
  { path: "/dashboard", name: "Dashboard", icon: "⚡" },
];

/* ─── Main layout ─────────────────────────────────────────── */
const MainApp: React.FC = () => {
  const { user, logout, getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  /* ── State ── */
  const [messagesData, setMessagesData] = useState<any>({
    important: [],
    regular: [],
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ragIndexed, setRagIndexed] = useState(false);
  const [ragMessageCount, setRagCount] = useState(0);
  const [cacheInfo, setCacheInfo] = useState<Record<string, any>>({});
  const [gmailAuth, setGmailAuth] = useState(false);
  const [twitterKeyword, setTwitter] = useState("python");
  const [redditKeyword, setReddit] = useState("technology");
  const [redditSubreddit, setSubreddit] = useState("all");

  /* ── Connected services (from user's setup preferences) ── */
  const [connectedServices, setConnectedServices] = useState<string[]>([]);

  /* ── Selected platforms = subset of connectedServices ─── */
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  /* Load connected services from Firestore user profile */
  useEffect(() => {
    const loadConnectedServices = async () => {
      if (!user) return;
      try {
        const token = await getToken();
        const res = await axios.get(
          `http://localhost:8000/user/profile?user_id=${user.uid}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const services: string[] = res.data?.services ?? [];
        setConnectedServices(services);
        // Default: select all connected services
        setSelectedPlatforms(services);
      } catch {
        // Fallback: show all platforms if profile fetch fails
        setConnectedServices(ALL_PLATFORMS.map((p) => p.id));
        setSelectedPlatforms(ALL_PLATFORMS.map((p) => p.id));
      }
    };
    loadConnectedServices();
  }, [user]);

  /* Gmail auth */
  useEffect(() => {
    if (user) checkGmailAuth();
  }, [user]);
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("gmail") === "success") {
      setGmailAuth(true);
      navigate("/", { replace: true });
    }
  }, [location]);

  const checkGmailAuth = async () => {
    try {
      const token = await getToken();
      const r = await axios.get(
        `http://localhost:8000/auth/gmail/status?user_id=${user?.uid}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setGmailAuth(r.data.authenticated);
    } catch {}
  };

  const handleGmailAuth = async () => {
    if (!user) return;
    const token = await getToken();
    const r = await axios.get(
      `http://localhost:8000/auth/gmail?user_id=${user.uid}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    window.location.href = r.data.auth_url;
  };

  /* Toggle a platform (only within connectedServices) */
  const togglePlatform = (id: string) => {
    if (!connectedServices.includes(id)) return;
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  /* RAG index */
  const indexMessagesForRAG = async (data: any) => {
    if (ragIndexed) return;
    try {
      const token = await getToken();
      const msgs = [...(data.important ?? []), ...(data.regular ?? [])].slice(
        0,
        10,
      );
      if (!msgs.length) return;
      const res = await fetch("http://localhost:8000/api/rag/index", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: { important: msgs, regular: [] } }),
      });
      if (!res.ok) return;
      const result = await res.json();
      setRagIndexed(true);
      setRagCount(result.message_count);
    } catch {}
  };

  /* Load / Refresh */
  const fetchMessages = async (forceRefresh = false) => {
    if (!selectedPlatforms.length) {
      setError("Select at least one platform");
      return;
    }
    forceRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const r = await axios.get("http://localhost:8000/messages", {
        params: {
          platforms: selectedPlatforms.join(","),
          twitter_keyword: twitterKeyword,
          reddit_keyword: redditKeyword,
          reddit_subreddit: redditSubreddit,
          limit: 20,
          filter_by_preferences: true,
          user_id: user?.uid,
          ...(forceRefresh && { force_refresh: true }),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessagesData(r.data);
      if (r.data.cache_info) setCacheInfo(r.data.cache_info);
      if (forceRefresh) setRagIndexed(false);
      await indexMessagesForRAG(r.data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch");
    }
    forceRefresh ? setRefreshing(false) : setLoading(false);
  };

  /* Only platforms that are in connectedServices */
  const visiblePlatforms = ALL_PLATFORMS.filter((p) =>
    connectedServices.includes(p.id),
  );
  const busy = loading || refreshing;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0a0f1e]">
      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        className={`
        ${sidebarOpen ? "w-72" : "w-[68px]"}
        sidebar-bg border-r border-slate-200 dark:border-slate-800
        flex flex-col transition-all duration-300 ease-in-out shrink-0
      `}
      >
        {/* Logo */}
        <div
          className={`flex items-center ${sidebarOpen ? "justify-between px-5" : "justify-center"} h-16 border-b border-slate-200 dark:border-slate-800`}
        >
          {sidebarOpen && (
            <span className="font-extrabold text-lg tracking-tight gradient-text">
              MessageHub
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="sidebar-icon-btn"
          >
            <span className="text-sm">{sidebarOpen ? "◀" : "▶"}</span>
          </button>
        </div>

        <div
          className={`flex-1 overflow-y-auto ${sidebarOpen ? "px-4 py-5 space-y-5" : "px-2 py-4 flex flex-col items-center gap-2"}`}
        >
          {sidebarOpen ? (
            <>
              {/* User pill */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {user?.email?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Signed in as
                  </p>
                  <p className="text-xs font-semibold truncate text-slate-800 dark:text-slate-200">
                    {user?.email}
                  </p>
                </div>
                <ThemeToggle />
              </div>

              {/* Nav */}
              <nav className="space-y-1">
                {NAV.map((l) => (
                  <button
                    key={l.path}
                    onClick={() => navigate(l.path)}
                    className={`nav-link w-full ${location.pathname === l.path ? "nav-link-active" : ""}`}
                  >
                    <span className="text-base w-5 text-center">{l.icon}</span>
                    <span>{l.name}</span>
                    {location.pathname === l.path && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
                    )}
                  </button>
                ))}
              </nav>

              <div className="border-t border-slate-200 dark:border-slate-800" />

              {/* ── Connected Platforms ── */}
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                    Connected Platforms
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {selectedPlatforms.length}/{visiblePlatforms.length}
                  </span>
                </div>

                {visiblePlatforms.length === 0 ? (
                  <div className="text-xs text-slate-400 dark:text-slate-600 text-center py-4 px-2">
                    No platforms connected yet.{" "}
                    <button
                      onClick={() => navigate("/dashboard")}
                      className="text-violet-500 hover:underline"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {visiblePlatforms.map((p) => {
                      const selected = selectedPlatforms.includes(p.id);
                      const info = cacheInfo[p.id];
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium
                            transition-all duration-150 border
                            ${
                              selected
                                ? "bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800/50 text-violet-800 dark:text-violet-300"
                                : "bg-transparent border-transparent text-slate-500 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60"
                            }
                          `}
                        >
                          <span className="text-base">{p.icon}</span>
                          <span className="flex-1 text-left">{p.name}</span>
                          {info?.is_fresh && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold">
                              ⚡{info.expires_in}m
                            </span>
                          )}
                          {/* Toggle indicator */}
                          <div
                            className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all
                            ${
                              selected
                                ? "bg-violet-500 text-white"
                                : "border border-slate-300 dark:border-slate-600"
                            }`}
                          >
                            {selected && (
                              <span className="text-[10px] font-bold">✓</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Gmail connect */}
              {selectedPlatforms.includes("gmail") &&
                visiblePlatforms.some((p) => p.id === "gmail") && (
                  <button
                    onClick={handleGmailAuth}
                    className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold border transition-all ${
                      gmailAuth
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100"
                    }`}
                  >
                    {gmailAuth ? "✅ Gmail Connected" : "🔗 Connect Gmail"}
                  </button>
                )}

              {/* Load / Refresh */}
              <div className="space-y-2">
                <button
                  onClick={() => fetchMessages(false)}
                  disabled={busy || !selectedPlatforms.length}
                  className={`w-full btn-primary flex items-center justify-center gap-2 ${busy || !selectedPlatforms.length ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Loading…
                    </>
                  ) : (
                    <>
                      <span>🚀</span> Load Messages
                    </>
                  )}
                </button>

                <button
                  onClick={() => fetchMessages(true)}
                  disabled={busy || !selectedPlatforms.length}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold border transition-all
                    bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400
                    border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30
                    ${busy || !selectedPlatforms.length ? "opacity-40 cursor-not-allowed" : ""}
                  `}
                >
                  {refreshing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                      Refreshing…
                    </>
                  ) : (
                    <>
                      <span>↺</span> Force Refresh
                    </>
                  )}
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 text-center px-2 py-2 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  ⚠️ {error}
                </p>
              )}

              {/* AI status */}
              {ragIndexed && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50">
                  <span className="animate-pulse-ring w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                  <p className="text-[11px] text-violet-700 dark:text-violet-300 font-medium">
                    AI ready · {ragMessageCount} msgs indexed
                  </p>
                </div>
              )}

              {/* Logout */}
              <button
                onClick={logout}
                className="w-full btn-danger flex items-center justify-center gap-2"
              >
                <span>⏏</span> Sign Out
              </button>
            </>
          ) : (
            /* ── Collapsed ── */
            <>
              {NAV.map((l) => (
                <button
                  key={l.path}
                  onClick={() => navigate(l.path)}
                  title={l.name}
                  className={`sidebar-icon-btn text-base ${location.pathname === l.path ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" : ""}`}
                >
                  {l.icon}
                </button>
              ))}
              <div className="w-8 border-t border-slate-200 dark:border-slate-800 my-1" />
              {visiblePlatforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePlatform(p.id)}
                  title={p.name}
                  className={`sidebar-icon-btn text-base ${selectedPlatforms.includes(p.id) ? "ring-2 ring-violet-400" : "opacity-40"}`}
                >
                  {p.icon}
                </button>
              ))}
              <div className="w-8 border-t border-slate-200 dark:border-slate-800 my-1" />
              <button
                onClick={() => fetchMessages(false)}
                disabled={busy}
                title="Load messages"
                className="sidebar-icon-btn text-violet-600 dark:text-violet-400"
              >
                🚀
              </button>
              <button
                onClick={logout}
                title="Sign out"
                className="sidebar-icon-btn text-red-500"
              >
                ⏏
              </button>
            </>
          )}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<MessageList messages={messagesData} />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/saved" element={<SavedMessages />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                connectedServices={connectedServices}
                onServicesChange={setConnectedServices}
              />
            }
          />
        </Routes>
      </main>

      <ChatAssistant isIndexed={ragIndexed} messageCount={ragMessageCount} />
    </div>
  );
};

const App: React.FC = () => (
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

export default App;

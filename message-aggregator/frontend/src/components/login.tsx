import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isSignup) {
        await signup(email, password);
        navigate("/setup");
      } else {
        await login(email, password);
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0a0f1e]">
      {/* Left panel – branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-violet-600 via-indigo-700 to-blue-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />

        <div className="relative">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            MessageHub
          </h1>
          <p className="text-indigo-200 text-sm mt-1">Your unified inbox</p>
        </div>

        <div className="relative space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight">
              All your messages.
              <br />
              One intelligent feed.
            </h2>
            <p className="mt-4 text-indigo-200 text-base leading-relaxed max-w-sm">
              Aggregate Gmail, Telegram, Discord, Reddit, Slack and Twitter into
              a single AI-curated dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: "🤖", t: "AI-powered message curation" },
              { icon: "⚡", t: "Smart caching — fewer API calls" },
              { icon: "📅", t: "Auto-detect events & add to calendar" },
            ].map((f) => (
              <div key={f.t} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-lg shrink-0">
                  {f.icon}
                </div>
                <span className="text-indigo-100 text-sm">{f.t}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-indigo-300/60 text-xs">© 2026 MessageHub</p>
      </div>

      {/* Right panel – form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-slide-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-extrabold gradient-text">
              MessageHub
            </h1>
          </div>

          <div className="card p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {isSignup ? "Create account" : "Welcome back"}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              {isSignup
                ? "Start aggregating your messages"
                : "Sign in to your account"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-fade-in">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-primary py-3 text-base ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    {isSignup ? "Creating…" : "Signing in…"}
                  </span>
                ) : isSignup ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsSignup((s) => !s);
                  setError("");
                }}
                className="text-sm text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                {isSignup
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-6">
            🔒 Secured by Firebase Authentication
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const GmailAuthButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const { user, getToken } = useAuth();

  useEffect(() => {
    checkGmailStatus();
  }, [user]);

  const checkGmailStatus = async () => {
    try {
      const token = await getToken();
      const response = await axios.get(
        "http://localhost:8000/auth/gmail/status",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setAuthenticated(response.data.authenticated);
    } catch (error) {
      setAuthenticated(false);
    }
  };

  const handleGmailAuth = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await axios.get("http://localhost:8000/auth/gmail", {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Redirect to Gmail OAuth
      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error("Error initiating Gmail auth:", error);
      alert("Failed to initiate Gmail authentication");
    } finally {
      setLoading(false);
    }
  };

  if (authenticated) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <span className="text-2xl">✅</span>
        <div>
          <p className="font-bold text-green-800 dark:text-green-300">
            Gmail Connected!
          </p>
          <p className="text-sm text-green-700 dark:text-green-400">
            Your emails will appear in the messages feed
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleGmailAuth}
      disabled={loading}
      className={`
        w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg
        flex items-center justify-center gap-2 transition-all
        ${loading ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      {loading ? (
        <>
          <span className="animate-spin">⏳</span>
          Redirecting...
        </>
      ) : (
        <>
          <span>📧</span>
          Authenticate with Gmail
        </>
      )}
    </button>
  );
};

export default GmailAuthButton;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

const Setup: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [job, setJob] = useState("");
  const [credentials, setCredentials] = useState<any>({});
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const services = ["telegram", "twitter", "gmail", "whatsapp", "discord"];
  const preferenceOptions = [
    "Job Opportunities",
    "Study Materials",
    "Physics",
    "Technology",
    "Business",
    "Donald Trump",
  ];

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handlePreferenceToggle = (pref: string) => {
    setPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleCredentialChange = (
    service: string,
    field: string,
    value: string
  ) => {
    setCredentials((prev: any) => ({
      ...prev,
      [service]: { ...prev[service], [field]: value },
    }));
  };

  const handleFinish = async () => {
    try {
      const token = await getToken();

      // Save user setup
      await axios.post(
        "http://localhost:8000/api/user/setup",
        {
          services: selectedServices,
          preferences,
          job,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Save credentials for each service
      for (const service of selectedServices) {
        if (credentials[service]) {
          await axios.post(
            "http://localhost:8000/api/user/credentials",
            {
              platform: service,
              credentials: credentials[service],
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
        }
      }

      navigate("/");
    } catch (error) {
      console.error("Error saving setup:", error);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Welcome! Let's set up your account</h1>

      {step === 1 && (
        <div>
          <h2>Select Services</h2>
          <p>Choose which platforms you want to aggregate messages from:</p>
          {services.map((service) => (
            <label key={service} style={{ display: "block", margin: "10px 0" }}>
              <input
                type="checkbox"
                checked={selectedServices.includes(service)}
                onChange={() => handleServiceToggle(service)}
              />
              {" " + service.charAt(0).toUpperCase() + service.slice(1)}
            </label>
          ))}
          <button
            onClick={() => setStep(2)}
            style={{ marginTop: "20px", padding: "10px 20px" }}
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Configure Service Credentials</h2>
          {selectedServices.includes("telegram") && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Telegram</h3>
              <input
                placeholder="API ID"
                value={credentials.telegram?.api_id || ""}
                onChange={(e) =>
                  handleCredentialChange("telegram", "api_id", e.target.value)
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
              <input
                placeholder="API Hash"
                value={credentials.telegram?.api_hash || ""}
                onChange={(e) =>
                  handleCredentialChange("telegram", "api_hash", e.target.value)
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
              <input
                placeholder="Phone Number"
                value={credentials.telegram?.phone || ""}
                onChange={(e) =>
                  handleCredentialChange("telegram", "phone", e.target.value)
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
            </div>
          )}

          {selectedServices.includes("twitter") && (
            <div style={{ marginBottom: "20px" }}>
              <h3>Twitter</h3>
              <input
                placeholder="Bearer Token"
                value={credentials.twitter?.bearer_token || ""}
                onChange={(e) =>
                  handleCredentialChange(
                    "twitter",
                    "bearer_token",
                    e.target.value
                  )
                }
                style={{
                  display: "block",
                  margin: "10px 0",
                  padding: "8px",
                  width: "100%",
                }}
              />
            </div>
          )}

          <button
            onClick={() => setStep(1)}
            style={{ marginRight: "10px", padding: "10px 20px" }}
          >
            Back
          </button>
          <button onClick={() => setStep(3)} style={{ padding: "10px 20px" }}>
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Set Your Preferences</h2>
          <p>What topics are you interested in?</p>
          {preferenceOptions.map((pref) => (
            <label key={pref} style={{ display: "block", margin: "10px 0" }}>
              <input
                type="checkbox"
                checked={preferences.includes(pref)}
                onChange={() => handlePreferenceToggle(pref)}
              />
              {" " + pref}
            </label>
          ))}

          <div style={{ marginTop: "20px" }}>
            <label>Your Job/Field (optional):</label>
            <input
              type="text"
              value={job}
              onChange={(e) => setJob(e.target.value)}
              placeholder="e.g., Software Engineer"
              style={{
                display: "block",
                margin: "10px 0",
                padding: "8px",
                width: "100%",
              }}
            />
          </div>

          <button
            onClick={() => setStep(2)}
            style={{ marginRight: "10px", padding: "10px 20px" }}
          >
            Back
          </button>
          <button
            onClick={handleFinish}
            style={{
              padding: "10px 20px",
              backgroundColor: "#28a745",
              color: "white",
            }}
          >
            Finish Setup
          </button>
        </div>
      )}
    </div>
  );
};

export default Setup;

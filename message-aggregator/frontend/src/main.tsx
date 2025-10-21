import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css"; // ✅ MUST BE FIRST
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

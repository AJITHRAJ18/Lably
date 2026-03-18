import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

// Global reset styles
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #f7f5f0;
    color: #1a1a18;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Build timestamp for cache busting
const BUILD_DATE = new Date().toISOString();
const APP_VERSION = "2.1.0";

// Log PWA information with version and timestamp
console.log(`NihongoFlash PWA loaded - Version ${APP_VERSION} (Build: ${BUILD_DATE})`);
// Add a color theme identifier to confirm theme changes
console.log('%cNihongoFlash - Japanese Learning App', 'color: hsl(238 83% 60%); font-size: 20px; font-weight: bold;');

// We'll let the UpdateNotification component handle service worker updates

createRoot(document.getElementById("root")!).render(<App />);

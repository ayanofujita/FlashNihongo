import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Build timestamp for cache busting
const BUILD_DATE = new Date().toISOString();
const APP_VERSION = "2.1.0";

// Log PWA information with version and timestamp
console.log(`FlashNihongo PWA loaded - Version ${APP_VERSION} (Build: ${BUILD_DATE})`);
// Add a color theme identifier to confirm theme changes
console.log('%cFlashNihongo - Japanese Learning App', 'color: hsl(238 83% 60%); font-size: 20px; font-weight: bold;');

// Check for service worker updates
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    // Force an update check for the service worker
    registration.update();
  });
}

createRoot(document.getElementById("root")!).render(<App />);

import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Log PWA information
console.log('FlashNihongo PWA loaded - Version 2.0');
// Add a color theme identifier to confirm theme changes
console.log('%cFlashNihongo - Japanese Learning App', 'color: hsl(238 83% 60%); font-size: 20px; font-weight: bold;');

createRoot(document.getElementById("root")!).render(<App />);

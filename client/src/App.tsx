import * as React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/Sidebar";
import MobileNavBar from "@/components/MobileNavBar";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import DecksPage from "@/pages/DecksPage";
import StudyPage from "@/pages/StudyPage";
import QuizPage from "@/pages/QuizPage";
import SearchPage from "@/pages/SearchPage";
import DeckViewPage from "@/pages/DeckViewPage";
import ProfilePage from "@/pages/ProfilePage";
import { UserProvider } from "@/components/auth/UserContext";

// Update Notification Component
function UpdateNotification() {
  const { toast, dismiss } = useToast();
  const [updateToastId, setUpdateToastId] = useState<string | null>(null);
  const [hasCheckedUpdate, setHasCheckedUpdate] = useState(false);

  // Store whether an update has been applied in session storage
  const updateAppliedKey = 'sw_update_applied';
  
  useEffect(() => {
    // Check if an update has already been applied in this session
    const updateApplied = sessionStorage.getItem(updateAppliedKey) === 'true';
    
    if ('serviceWorker' in navigator && !hasCheckedUpdate && !updateApplied) {
      // Listen for messages from the service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'WORKER_UPDATED') {
          // Service worker has been updated, no need to show notification again
          sessionStorage.setItem(updateAppliedKey, 'true');
          
          // If there's an update toast showing, dismiss it
          if (updateToastId) {
            dismiss(updateToastId);
          }
        }
      });
      
      // Check for updates when the component mounts
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.waiting) {
          // There's a new version waiting - show toast only if update not already applied
          if (!updateApplied) {
            const result = toast({
              title: "New version available!",
              description: "Refresh to update to the latest version.",
              action: (
                <button 
                  className="rounded bg-primary text-primary-foreground px-3 py-1 text-xs"
                  onClick={() => {
                    if (registration.waiting) {
                      // Send message to service worker to skip waiting
                      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                      
                      // Mark as applied in this session
                      sessionStorage.setItem(updateAppliedKey, 'true');
                      
                      // Reload the page to ensure the new service worker takes control
                      window.location.reload();
                    }
                  }}
                >
                  Update Now
                </button>
              ),
              duration: 0, // Don't auto-dismiss
            });
            
            // Store the toast ID as a string so we can dismiss it if needed
            setUpdateToastId(typeof result === 'object' && result.id ? result.id : null);
          }
        }
        
        // Mark that we've checked for updates
        setHasCheckedUpdate(true);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  return null; // This component doesn't render anything visible
}

function Router() {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar is visible on medium screens and above */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex flex-col flex-grow overflow-y-auto pb-16 md:pb-0">
        <main className="flex-grow w-full px-4 py-6 md:px-6 md:py-8">
          <Switch>
            <Route path="/" component={HomePage} />
            <Route path="/decks" component={DecksPage} />
            <Route path="/decks/:deckId/cards" component={DeckViewPage} />
            <Route path="/study/:deckId?" component={StudyPage} />
            <Route path="/quiz/:deckId?" component={QuizPage} />
            <Route path="/search" component={SearchPage} />
            <Route path="/profile" component={ProfilePage} />
            <Route component={NotFound} />
          </Switch>
        </main>
        <Footer />
      </div>
      
      {/* Mobile navigation - visible only on small screens */}
      <MobileNavBar />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router />
        <UpdateNotification />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;

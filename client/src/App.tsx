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
  const { toast } = useToast();
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if there's a new version at an interval
      const checkForUpdates = () => {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration) {
            registration.update()
              .then(() => {
                if (registration.waiting) {
                  // There's a new version waiting
                  setNewVersionAvailable(true);
                  
                  toast({
                    title: "New version available!",
                    description: "Refresh to update to the latest version.",
                    action: (
                      <button 
                        className="rounded bg-primary text-primary-foreground px-3 py-1 text-xs"
                        onClick={() => {
                          if (registration.waiting) {
                            // Send message to service worker to skip waiting
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                          }
                          window.location.reload();
                        }}
                      >
                        Update Now
                      </button>
                    ),
                    duration: 0, // Don't auto-dismiss
                  });
                }
              });
          }
        });
      };
      
      // Check for updates on page load
      checkForUpdates();
      
      // And then check periodically
      const interval = setInterval(checkForUpdates, 60 * 1000); // Check every minute
      
      return () => clearInterval(interval);
    }
  }, [toast]);
  
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

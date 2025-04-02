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
const UpdateNotification = () => {
  const { toast } = useToast();
  const [showingUpdate, setShowingUpdate] = useState(false);
  
  useEffect(() => {
    if (!('serviceWorker' in navigator) || showingUpdate) {
      return;
    }
    
    // Check if an update has already been applied in this session
    const updateAppliedKey = 'sw_update_applied';
    const updateApplied = sessionStorage.getItem(updateAppliedKey) === 'true';
    
    if (updateApplied) {
      return;
    }
    
    // Listen for messages from the service worker
    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'WORKER_UPDATED') {
        sessionStorage.setItem(updateAppliedKey, 'true');
      }
    };
    
    navigator.serviceWorker.addEventListener('message', messageHandler);
    
    // Check for updates
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        setShowingUpdate(true);
        
        toast({
          title: "New version available!",
          description: "Refresh to update to the latest version.",
          action: (
            <button 
              className="rounded bg-primary text-primary-foreground px-3 py-1 text-xs"
              onClick={() => {
                if (registration.waiting) {
                  registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                  sessionStorage.setItem(updateAppliedKey, 'true');
                  window.location.reload();
                }
              }}
            >
              Update Now
            </button>
          ),
          duration: 0, // Don't auto-dismiss
        });
      }
    });
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, [toast, showingUpdate]);
  
  return null;
};

// Main app router
const Router = () => {
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
};

// Main App component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <Router />
        <UpdateNotification />
        <Toaster />
      </UserProvider>
    </QueryClientProvider>
  );
};

export default App;

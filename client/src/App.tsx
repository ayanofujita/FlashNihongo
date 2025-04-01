import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
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
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

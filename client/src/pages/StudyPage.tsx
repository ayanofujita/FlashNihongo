import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import StudyMode from "@/components/study/StudyMode";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Deck {
  id: number;
  name: string;
  hasDueCards: boolean;
  dueCardCount: number;
}

const StudyPage = () => {
  const { deckId } = useParams();
  
  // Only fetch decks with due cards if no specific deck is selected
  const { data: decks, isLoading, error } = useQuery<Deck[]>({
    queryKey: ["/api/decks/due"],
    queryFn: async () => {
      console.log("Fetching decks with due cards...");
      try {
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/decks/due?userId=1&t=${timestamp}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to fetch decks with due cards: ${response.status} ${response.statusText}`, errorText);
          return [];
        }
        
        const data = await response.json();
        console.log("Received decks with due info:", data);
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching decks with due cards:", error);
        return [];
      }
    },
    enabled: !deckId, // Only run this query if no deckId is provided
    staleTime: 10000, // 10 seconds
  });
  
  // If no deck ID is provided, show a deck selection screen
  if (!deckId) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Study Flashcards</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : (
          <>
            {decks && decks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {decks.filter(deck => deck.hasDueCards).map((deck) => (
                  <Link key={deck.id} href={`/study/${deck.id}`}>
                    <a className="block bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold">{deck.name}</h3>
                        <Badge variant="outline" className="bg-blue-50">
                          {deck.dueCardCount} {deck.dueCardCount === 1 ? 'card' : 'cards'} due
                        </Badge>
                      </div>
                      <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2">
                        <BookOpen size={16} />
                        <span>Study Now</span>
                      </Button>
                    </a>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-lg shadow p-8">
                <h3 className="text-xl font-semibold mb-3">No Cards Due for Review</h3>
                <p className="text-gray-600 mb-6">
                  {error 
                    ? "There was an error fetching your due cards. Please try again later."
                    : decks && decks.length > 0 
                      ? "You have decks, but none have cards due for review right now."
                      : "You're all caught up! There are no cards due for review right now."
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="outline">
                    <Link href="/decks">Manage Decks</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/search">Add New Cards</Link>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  
  return <StudyMode deckId={parseInt(deckId)} />;
};

export default StudyPage;

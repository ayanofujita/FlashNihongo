import { useState } from "react";
import { useUser } from "../auth/UserContext";
import { useQuery } from "@tanstack/react-query";
import DeckCard from "./DeckCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DeckForm from "./DeckForm";

interface Deck {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  lastStudied: string | null;
}

const DeckList = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: decks, isLoading, error } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  // Fetch card counts for each deck
  const { data: cardCounts, isLoading: isLoadingCounts } = useQuery<Record<number, number>>({
    queryKey: ["/api/cardCounts"],
    queryFn: async () => {
      if (!decks) return {};
      
      const counts: Record<number, number> = {};
      await Promise.all(
        decks.map(async (deck) => {
          const response = await fetch(`/api/decks/${deck.id}/cards`);
          const cards = await response.json();
          counts[deck.id] = cards.length;
        })
      );
      
      return counts;
    },
    enabled: !!decks,
  });

  const { user } = useUser();

  if (!user) {
    return (
      <div className="text-center py-10 bg-white rounded-lg shadow border border-gray-200 p-8">
        <h3 className="text-xl font-semibold mb-3">Sign In Required</h3>
        <p className="text-gray-600 mb-6">Please sign in to create and manage your flashcard decks.</p>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Failed to load decks. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">My Decks</h2>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Deck
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-5">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <div className="flex space-x-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-4" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks?.map((deck) => (
            <DeckCard
              key={deck.id}
              id={deck.id}
              name={deck.name}
              description={deck.description || undefined}
              cardCount={cardCounts?.[deck.id] || 0}
              lastStudied={deck.lastStudied ? new Date(deck.lastStudied) : null}
            />
          ))}
          
          {decks?.length === 0 && (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500 mb-4">You don't have any decks yet. Create your first deck to get started!</p>
              <Button 
                className="bg-blue-600 hover:bg-blue-700" 
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" /> Create First Deck
              </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogTitle>Create New Deck</DialogTitle>
          <DeckForm onSuccess={() => setCreateDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeckList;

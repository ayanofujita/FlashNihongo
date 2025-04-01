import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Edit, ArrowLeft } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import CardForm from "@/components/deck/CardForm";
import { Skeleton } from "@/components/ui/skeleton";

interface Card {
  id: number;
  deckId: number;
  front: string;
  back: string;
  reading: string | null;
  partOfSpeech: string | null;
  example: string | null;
  exampleTranslation: string | null;
  createdAt: string;
}

interface Deck {
  id: number;
  name: string;
  description: string | null;
}

const DeckViewPage = () => {
  const params = useParams<{ deckId: string }>();
  const deckId = parseInt(params.deckId);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [cardToEdit, setCardToEdit] = useState<Card | null>(null);

  const { data: deck, isLoading: isLoadingDeck } = useQuery<Deck>({
    queryKey: [`/api/decks/${deckId}`],
    enabled: !isNaN(deckId),
  });

  const { data: cards, isLoading: isLoadingCards } = useQuery<Card[]>({
    queryKey: [`/api/decks/${deckId}/cards`],
    enabled: !isNaN(deckId),
  });

  const handleDeleteClick = (id: number) => {
    setCardToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEditClick = (card: Card) => {
    setCardToEdit(card);
    setEditDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!cardToDelete) return;

    try {
      await apiRequest("DELETE", `/api/cards/${cardToDelete}`);
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      queryClient.invalidateQueries({ queryKey: ["/api/cardCounts"] });
      
      toast({
        title: "Card deleted",
        description: "The card has been removed from this deck.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCardToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  if (isNaN(deckId)) {
    navigate("/decks");
    return null;
  }

  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/decks")} 
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Decks
        </Button>
        <h2 className="text-xl font-bold">
          {isLoadingDeck ? (
            <Skeleton className="h-7 w-48" />
          ) : (
            deck?.name || "Deck not found"
          )}
        </h2>
      </div>

      {isLoadingCards ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="border border-gray-200">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-1" />
                    <Skeleton className="h-4 w-full mt-3" />
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cards && cards.length > 0 ? (
        <div className="space-y-4">
          {cards.map((card) => (
            <Card key={card.id} className="border border-gray-200 hover:shadow-md transition">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-bold">{card.front}</div>
                    {card.reading && (
                      <div className="text-sm text-gray-600 mt-1">{card.reading}</div>
                    )}
                    <div className="mt-2">{card.back}</div>
                    {card.partOfSpeech && (
                      <div className="text-xs text-gray-500 mt-1">
                        Part of speech: {card.partOfSpeech}
                      </div>
                    )}
                    {card.example && (
                      <div className="mt-3 text-sm">
                        <div className="italic text-gray-600">{card.example}</div>
                        {card.exampleTranslation && (
                          <div className="text-gray-700">{card.exampleTranslation}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(card)}
                    >
                      <Edit className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(card.id)}
                    >
                      <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">This deck doesn't have any cards yet.</p>
          <Button 
            onClick={() => {
              setCardToEdit(null);
              setEditDialogOpen(true);
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700"
          >
            Add Card
          </Button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit card dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogTitle>
            {cardToEdit ? "Edit Card" : "Add New Card"}
          </DialogTitle>
          <CardForm 
            deckId={deckId}
            cardId={cardToEdit?.id}
            defaultValues={cardToEdit ? {
              front: cardToEdit.front,
              back: cardToEdit.back,
              reading: cardToEdit.reading || undefined,
              partOfSpeech: cardToEdit.partOfSpeech || undefined,
              example: cardToEdit.example || undefined,
              exampleTranslation: cardToEdit.exampleTranslation || undefined,
            } : undefined}
            onSuccess={() => {
              setEditDialogOpen(false);
              setCardToEdit(null);
              queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
              toast({
                title: cardToEdit ? "Card updated" : "Card added",
                description: cardToEdit 
                  ? "The card has been updated successfully." 
                  : "The card has been added to the deck.",
              });
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DeckViewPage;
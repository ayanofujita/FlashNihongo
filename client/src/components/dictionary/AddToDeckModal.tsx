import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Deck {
  id: number;
  name: string;
}

interface AddToDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  word: {
    japanese: {
      word?: string;
      reading?: string;
    }[];
    senses: {
      english_definitions: string[];
      parts_of_speech?: string[];
      examples?: {
        text: string;
        translation?: string;
      }[];
    }[];
  } | null;
}

const AddToDeckModal = ({ isOpen, onClose, word }: AddToDeckModalProps) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>("");
  const { toast } = useToast();

  const { data: decks, isLoading: isLoadingDecks } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
    enabled: isOpen,
  });

  // Reset selected deck when dialog opens
  useEffect(() => {
    if (isOpen && decks?.length) {
      setSelectedDeckId(decks[0].id.toString());
    }
  }, [isOpen, decks]);

  interface CardData {
    deckId: number;
    front: string;
    back: string;
    reading?: string;
    partOfSpeech?: string;
    example?: string;
    exampleTranslation?: string;
  }
  
  const addCardMutation = useMutation({
    mutationFn: async (cardData: CardData) => {
      return await apiRequest("POST", "/api/cards", cardData);
    },
    onSuccess: (_responseData, variables) => {
      toast({
        title: "Card added",
        description: "The card has been added to your deck.",
      });
      onClose();
      // Invalidate relevant queries to update card counts
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cardCounts"] });
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${variables.deckId}/cards`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add card to deck. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleAddCard = async () => {
    if (!word || !selectedDeckId) return;

    const front = word.japanese[0]?.word || word.japanese[0]?.reading || "";
    const back = word.senses[0]?.english_definitions.join("; ") || "";
    const reading = word.japanese[0]?.reading || "";
    const partOfSpeech = word.senses[0]?.parts_of_speech?.join(", ") || "";
    const example = word.senses[0]?.examples?.[0]?.text || "";
    const exampleTranslation = word.senses[0]?.examples?.[0]?.translation || "";

    const cardData = {
      deckId: parseInt(selectedDeckId),
      front,
      back,
      reading,
      partOfSpeech,
      example,
      exampleTranslation
    };

    addCardMutation.mutate(cardData);
  };

  if (!word) return null;

  const japanese = word.japanese[0];
  const sense = word.senses[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to Deck</DialogTitle>
          <DialogDescription>
            Add this word to one of your flashcard decks
          </DialogDescription>
        </DialogHeader>

        <div className="mb-4">
          <p className="text-lg font-jp mb-1">
            {japanese?.word || ""} {japanese?.reading ? `(${japanese.reading})` : ""}
          </p>
          <p className="text-gray-600">{sense?.english_definitions.join("; ")}</p>
        </div>

        <div className="mb-4">
          <Label htmlFor="deck-select" className="block text-gray-700 text-sm font-medium mb-2">
            Select Deck
          </Label>
          {isLoadingDecks ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading decks...</span>
            </div>
          ) : decks && decks.length > 0 ? (
            <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a deck" />
              </SelectTrigger>
              <SelectContent>
                {decks.map((deck) => (
                  <SelectItem key={deck.id} value={deck.id.toString()}>
                    {deck.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-red-500">No decks available. Please create a deck first.</p>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddCard} 
            disabled={!selectedDeckId || addCardMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {addCardMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Card"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddToDeckModal;

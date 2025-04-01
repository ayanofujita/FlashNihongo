import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface CardDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: number;
    front: string;
    back: string;
    reading: string | null;
    partOfSpeech: string | null;
    example: string | null;
    exampleTranslation: string | null;
  } | null;
  onEdit: () => void;
  onDelete: () => void;
}

const CardDetailsModal = ({ 
  isOpen, 
  onClose, 
  card, 
  onEdit, 
  onDelete 
}: CardDetailsModalProps) => {
  if (!card) return null;

  // Only show if there's an example
  if (!card.example && !card.exampleTranslation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl">Example for <span className="font-jp">{card.front}</span></span>
            <Button
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-6 w-6 rounded-full absolute right-4 top-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {card.example && (
            <div className="text-lg font-jp">{card.example}</div>
          )}
          {card.exampleTranslation && (
            <div className="text-gray-600 italic">{card.exampleTranslation}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailsModal;
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <span className="text-2xl font-jp mr-3">{card.front}</span>
            {card.reading && <span className="text-gray-500">({card.reading})</span>}
          </DialogTitle>
          {card.partOfSpeech && (
            <DialogDescription className="text-sm text-gray-600">
              {card.partOfSpeech}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 my-2">
          <div>
            <h4 className="text-sm font-medium mb-1">Meaning</h4>
            <p className="text-lg">{card.back}</p>
          </div>

          {(card.example || card.exampleTranslation) && (
            <div className="border-t pt-3 mt-3">
              <h4 className="text-sm font-medium mb-2">Example</h4>
              {card.example && (
                <p className="text-gray-800 font-jp mb-1">{card.example}</p>
              )}
              {card.exampleTranslation && (
                <p className="text-gray-600 italic">{card.exampleTranslation}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex items-center text-red-600 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailsModal;
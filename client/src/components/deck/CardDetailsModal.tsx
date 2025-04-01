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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white">
          <DialogHeader className="p-0 space-y-2">
            <DialogTitle className="text-xl flex items-center text-white">
              <span className="text-3xl font-jp mr-3">{card.front}</span>
              {card.reading && <span className="opacity-90 text-xl">({card.reading})</span>}
            </DialogTitle>
            {card.partOfSpeech && (
              <DialogDescription className="text-sm text-blue-100 opacity-90">
                {card.partOfSpeech}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <h4 className="text-sm font-medium mb-2 text-gray-500 uppercase tracking-wide">Meaning</h4>
            <p className="text-xl text-gray-800">{card.back}</p>
          </div>

          {(card.example || card.exampleTranslation) && (
            <div className="bg-blue-50 rounded-lg p-4 shadow-sm border border-blue-100">
              <h4 className="text-sm font-medium mb-2 text-blue-600 uppercase tracking-wide">Example</h4>
              {card.example && (
                <p className="text-lg text-gray-800 font-jp mb-2">{card.example}</p>
              )}
              {card.exampleTranslation && (
                <p className="text-gray-600">{card.exampleTranslation}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="flex items-center text-red-600 hover:text-white hover:bg-red-600 border-red-200"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onEdit}
              className="flex items-center bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CardDetailsModal;
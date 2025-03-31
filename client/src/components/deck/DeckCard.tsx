import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, GraduationCap, HelpCircle, Layers, Clock } from "lucide-react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DeckForm from "./DeckForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface DeckCardProps {
  id: number;
  name: string;
  description?: string;
  cardCount: number;
  lastStudied?: Date | null;
}

const DeckCard = ({ id, name, description, cardCount, lastStudied }: DeckCardProps) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const formatLastStudied = () => {
    if (!lastStudied) return "Never studied";
    
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastStudied.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Studied today";
    if (diffInDays === 1) return "Studied yesterday";
    if (diffInDays < 7) return `Studied ${diffInDays} days ago`;
    if (diffInDays < 30) return `Studied ${Math.floor(diffInDays / 7)} weeks ago`;
    return `Studied ${Math.floor(diffInDays / 30)} months ago`;
  };

  const handleDelete = async () => {
    try {
      await apiRequest("DELETE", `/api/decks/${id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({
        title: "Deck deleted",
        description: `"${name}" has been removed.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the deck. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition">
        <CardContent className="p-5">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-gray-800">{name}</h3>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
              </Button>
            </div>
          </div>
          <p className="text-gray-600 mt-2 text-sm">{description}</p>
          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              <Layers className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">{cardCount} cards</span>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 text-gray-400 mr-1" />
              <span>{formatLastStudied()}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 p-3 border-t border-gray-200 flex justify-between">
          <Button variant="ghost" className="text-blue-600 hover:text-blue-800 font-medium text-sm h-auto p-0" asChild>
            <Link href={`/study/${id}`}>
              <GraduationCap className="h-4 w-4 mr-1" /> Study
            </Link>
          </Button>
          <Button variant="ghost" className="text-violet-600 hover:text-violet-800 font-medium text-sm h-auto p-0" asChild>
            <Link href={`/quiz/${id}`}>
              <HelpCircle className="h-4 w-4 mr-1" /> Quiz
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the deck "{name}" and all its cards. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit deck dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DeckForm 
            deckId={id} 
            defaultValues={{ name, description: description || "" }}
            onSuccess={() => setEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DeckCard;

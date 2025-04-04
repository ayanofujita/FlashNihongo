import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search } from "lucide-react";

const formSchema = z.object({
  front: z.string().min(1, "Front side is required"),
  back: z.string().min(1, "Back side is required"),
  reading: z.string().optional(),
  partOfSpeech: z.string().optional(),
  example: z.string().optional(),
  exampleTranslation: z.string().optional(),
});

interface CardFormProps {
  deckId: number;
  cardId?: number; // If provided, this is an edit form
  defaultValues?: {
    front: string;
    back: string;
    reading?: string;
    partOfSpeech?: string;
    example?: string;
    exampleTranslation?: string;
  };
  onSuccess?: () => void;
}

const CardForm = ({ deckId, cardId, defaultValues, onSuccess }: CardFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingExamples, setIsFetchingExamples] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!cardId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      front: "",
      back: "",
      reading: "",
      partOfSpeech: "",
      example: "",
      exampleTranslation: "",
    }
  });

  const fetchExamples = async () => {
    const japaneseWord = form.getValues("front");
    
    if (!japaneseWord) {
      toast({
        title: "Input needed",
        description: "Please enter a Japanese word first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsFetchingExamples(true);
    try {
      const response = await fetch(`/api/examples?word=${encodeURIComponent(japaneseWord)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch examples");
      }
      
      const examples = await response.json();
      
      if (examples && examples.length > 0) {
        // Select the first example
        form.setValue("example", examples[0].text);
        form.setValue("exampleTranslation", examples[0].translation);
        
        toast({
          title: "Examples found",
          description: "Added an example sentence to your card.",
        });
      } else {
        toast({
          title: "No examples found",
          description: "No example sentences were found for this word.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch example sentences.",
        variant: "destructive",
      });
    } finally {
      setIsFetchingExamples(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {

      if (isEditMode) {
        await apiRequest("PUT", `/api/cards/${cardId}`, { ...values, deckId });
        toast({
          title: "Card updated",
          description: "Your card has been updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/cards", { ...values, deckId });
        toast({
          title: "Card created",
          description: "Your new card has been added to the deck.",
        });
        // Reset form after successful submission when creating a new card
        form.reset({
          front: "",
          back: "",
          reading: "",
          partOfSpeech: "",
          example: "",
          exampleTranslation: "",
        });
      }
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/decks/${deckId}/cards`] });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      // Check for duplicate card error (HTTP 409 conflict)
      if (error.status === 409) {
        toast({
          title: "Duplicate card",
          description: "This card already exists in the deck. Please use a different front text.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: isEditMode ? "Failed to update card." : "Failed to create card.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">{isEditMode ? "Edit Card" : "Add New Card"}</h2>
          
          <FormField
            control={form.control}
            name="front"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Front Side (Japanese)</FormLabel>
                <FormControl>
                  <Input placeholder="例: 食べる" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="back"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Back Side (English/Definition)</FormLabel>
                <FormControl>
                  <Input placeholder="例: to eat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="reading"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reading (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="例: たべる" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="partOfSpeech"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Part of Speech (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="例: Verb, Noun, Adjective" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">Example Sentences</div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={fetchExamples}
                disabled={isFetchingExamples}
                className="flex items-center gap-1 text-xs"
              >
                {isFetchingExamples ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Finding examples...
                  </>
                ) : (
                  <>
                    <Search className="h-3 w-3" />
                    Find examples
                  </>
                )}
              </Button>
            </div>
            
            <FormField
              control={form.control}
              name="example"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example Sentence (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="例: 私は毎日りんごを食べます。" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="exampleTranslation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Example Translation (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="例: I eat an apple every day." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Add Card"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CardForm;
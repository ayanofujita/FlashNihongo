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
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update card." : "Failed to create card.",
        variant: "destructive",
      });
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
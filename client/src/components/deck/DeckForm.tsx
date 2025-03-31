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
  name: z.string().min(1, "Deck name is required").max(100, "Deck name is too long"),
  description: z.string().max(500, "Description is too long"),
});

interface DeckFormProps {
  deckId?: number; // If provided, this is an edit form
  defaultValues?: {
    name: string;
    description: string;
  };
  onSuccess?: () => void;
}

const DeckForm = ({ deckId, defaultValues, onSuccess }: DeckFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditMode = !!deckId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      description: "",
    }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await apiRequest("PUT", `/api/decks/${deckId}`, values);
        toast({
          title: "Deck updated",
          description: "Your deck has been updated successfully.",
        });
      } else {
        await apiRequest("POST", "/api/decks", { ...values, userId: 1 }); // Default userId for this example
        toast({
          title: "Deck created",
          description: "Your new deck has been created.",
        });
        form.reset({ name: "", description: "" });
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: isEditMode ? "Failed to update deck." : "Failed to create deck.",
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
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deck Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter deck name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Enter deck description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditMode ? "Save Changes" : "Create Deck"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default DeckForm;

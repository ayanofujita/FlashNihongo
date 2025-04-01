import { DictionaryResult, dictionaryResultSchema } from "@shared/schema";

const JISHO_API_URL = "https://jisho.org/api/v1/search/words";

interface JishoApiResponse {
  meta: {
    status: number;
  };
  data: any[];
}

export async function searchWord(query: string): Promise<DictionaryResult[]> {
  try {
    const response = await fetch(`${JISHO_API_URL}?keyword=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error(`Jisho API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json() as JishoApiResponse;
    
    if (data.meta.status !== 200) {
      throw new Error(`Jisho API returned status: ${data.meta.status}`);
    }
    
    // Transform and validate the API response to match our schema
    const results: DictionaryResult[] = [];
    
    for (const item of data.data) {
      try {
        const result: DictionaryResult = {
          slug: item.slug,
          japanese: item.japanese.map((jp: any) => ({
            word: jp.word,
            reading: jp.reading
          })),
          senses: item.senses.map((sense: any) => ({
            english_definitions: sense.english_definitions || [],
            parts_of_speech: sense.parts_of_speech || [],
            tags: sense.tags || [],
            examples: sense.examples ? sense.examples.map((ex: any) => ({
              text: ex.text,
              translation: ex.translation
            })) : []
          }))
        };
        
        // Validate with our schema
        const validatedResult = dictionaryResultSchema.parse(result);
        results.push(validatedResult);
      } catch (validationError) {
        console.error("Failed to validate dictionary result:", validationError);
        // Skip invalid results
      }
    }
    
    return results;
  } catch (error) {
    console.error("Error fetching from Jisho API:", error);
    throw error;
  }
}

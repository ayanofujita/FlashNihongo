import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SearchResultProps {
  result: {
    slug: string;
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
  };
  onAddToDeck: () => void;
}

const SearchResult = ({ result, onAddToDeck }: SearchResultProps) => {
  const getMainWord = () => {
    return result.japanese[0]?.word || result.japanese[0]?.reading || "";
  };

  const getReading = () => {
    return result.japanese[0]?.reading || "";
  };

  const getPartOfSpeech = () => {
    const pos = result.senses[0]?.parts_of_speech || [];
    return pos.length > 0 ? pos[0] : "Unknown";
  };

  const getDefinition = () => {
    const defs = result.senses[0]?.english_definitions || [];
    return defs.length > 0 ? `${defs.join("; ")}` : "No definition available";
  };

  const getExample = () => {
    return result.senses[0]?.examples?.[0] || null;
  };

  // Determine the badge color based on part of speech
  const getBadgeVariant = () => {
    const pos = getPartOfSpeech().toLowerCase();
    if (pos.includes("verb")) return "bg-blue-100 text-blue-800";
    if (pos.includes("noun")) return "bg-green-100 text-green-800";
    if (pos.includes("adjective")) return "bg-purple-100 text-purple-800";
    if (pos.includes("adverb")) return "bg-amber-100 text-amber-800";
    return "bg-gray-100 text-gray-800";
  };

  const example = getExample();

  return (
    <div className="p-5 border-b border-gray-200 last:border-b-0">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-2xl font-jp font-medium">{getMainWord()}</span>
            <span className="text-gray-600">{getReading()}</span>
            <Badge className={`${getBadgeVariant()} text-xs px-2 py-1`}>
              {getPartOfSpeech()}
            </Badge>
          </div>
          <p className="text-gray-800 mb-1">{getDefinition()}</p>
          {example && (
            <>
              <p className="text-gray-600 text-sm italic mb-3">{example.text}</p>
              {example.translation && (
                <p className="text-gray-600 text-sm italic mb-3">{example.translation}</p>
              )}
            </>
          )}
        </div>
        <Button 
          className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-1 h-auto whitespace-nowrap"
          onClick={onAddToDeck}
        >
          <Plus className="h-4 w-4 mr-1" /> Add to Deck
        </Button>
      </div>
    </div>
  );
};

export default SearchResult;

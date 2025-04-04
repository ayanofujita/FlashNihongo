import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import SearchResult from "./SearchResult";
import AddToDeckModal from "./AddToDeckModal";
import { Skeleton } from "@/components/ui/skeleton";

interface DictionaryResult {
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
}

const DictionarySearch = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedWord, setSelectedWord] = useState<DictionaryResult | null>(null);
  
  const { data: results, isLoading, error } = useQuery<DictionaryResult[]>({
    queryKey: [`/api/dictionary/search?q=${searchTerm}`],
    enabled: !!searchTerm,
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      });
      return;
    }
    setSearchTerm(searchQuery.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Japanese Dictionary Search</h2>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <Input
              type="text"
              placeholder="Search for a Japanese word..."
              className="w-full pl-10 pr-10 py-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            {searchQuery && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div className="flex">
            <Button 
              className="bg-blue-600 hover:bg-blue-700" 
              onClick={handleSearch}
              disabled={isLoading}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          Error searching the dictionary. Please try again.
        </div>
      )}

      {searchTerm && (
        <h3 className="font-medium text-gray-800 mb-4">
          {isLoading ? "Searching..." : results?.length === 0 ? "No results found" : "Search Results"}
        </h3>
      )}
      
      {isLoading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-5 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16 rounded" />
                  </div>
                  <Skeleton className="h-5 w-full max-w-md mb-1" />
                  <Skeleton className="h-4 w-full max-w-lg mb-3" />
                </div>
                <Skeleton className="h-8 w-28" />
              </div>
            </div>
          ))}
        </div>
      ) : results && results.length > 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden mb-6">
          {results.map((result, index) => (
            <SearchResult 
              key={index}
              result={result}
              onAddToDeck={() => setSelectedWord(result)}
            />
          ))}
        </div>
      ) : searchTerm && !isLoading ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
          <p className="text-gray-500">No results found for "{searchTerm}". Try another search term.</p>
        </div>
      ) : null}
      
      <AddToDeckModal 
        isOpen={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        word={selectedWord}
      />
    </div>
  );
};

export default DictionarySearch;

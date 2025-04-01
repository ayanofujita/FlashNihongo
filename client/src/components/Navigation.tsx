import { useLocation, Link } from "wouter";
import { Book, GraduationCap, HelpCircle, Search, Home } from "lucide-react";

const Navigation = () => {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/decks") return location.startsWith("/decks");
    return location.startsWith(path);
  };
  
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto">
        <nav className="flex overflow-x-auto">
          <Link href="/">
            <a className={`px-4 py-3 flex-shrink-0 flex items-center ${
              isActive("/") 
                ? "text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}>
              <Home className="mr-2 h-4 w-4" /> Home
            </a>
          </Link>
          
          <Link href="/decks">
            <a className={`px-4 py-3 flex-shrink-0 flex items-center ${
              isActive("/decks") 
                ? "text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}>
              <Book className="mr-2 h-4 w-4" /> Decks
            </a>
          </Link>
          
          <Link href="/study">
            <a className={`px-4 py-3 flex-shrink-0 flex items-center ${
              isActive("/study") 
                ? "text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}>
              <GraduationCap className="mr-2 h-4 w-4" /> Study
            </a>
          </Link>
          
          <Link href="/quiz">
            <a className={`px-4 py-3 flex-shrink-0 flex items-center ${
              isActive("/quiz") 
                ? "text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}>
              <HelpCircle className="mr-2 h-4 w-4" /> Quiz
            </a>
          </Link>
          
          <Link href="/search">
            <a className={`px-4 py-3 flex-shrink-0 flex items-center ${
              isActive("/search") 
                ? "text-blue-600 border-b-2 border-blue-600 font-medium" 
                : "text-gray-500 hover:text-gray-700"
            }`}>
              <Search className="mr-2 h-4 w-4" /> Search
            </a>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Navigation;

import { useLocation, Link } from "wouter";
import { Home, Book, GraduationCap, HelpCircle, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Sidebar = () => {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === "/") return location === "/";
    if (path === "/decks") return location.startsWith("/decks");
    return location.startsWith(path);
  };
  
  return (
    <div className="bg-white shadow w-64 flex-shrink-0 min-h-screen flex flex-col">
      {/* Logo/Header Section */}
      <div className="p-4 border-b">
        <Link href="/">
          <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
            <h1 className="text-2xl font-bold text-blue-600">Flash日本語</h1>
          </div>
        </Link>
      </div>
      
      {/* User Profile Section */}
      <div className="p-4 border-b">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">Username</p>
            <p className="text-sm text-gray-500">Student</p>
          </div>
        </div>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-grow py-4">
        <nav className="space-y-1">
          <Link href="/">
            <a className={`px-4 py-3 flex items-center ${
              isActive("/") 
                ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } transition-colors duration-200`}>
              <Home className="mr-3 h-5 w-5" /> Home
            </a>
          </Link>
          
          <Link href="/decks">
            <a className={`px-4 py-3 flex items-center ${
              isActive("/decks") 
                ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } transition-colors duration-200`}>
              <Book className="mr-3 h-5 w-5" /> Decks
            </a>
          </Link>
          
          <Link href="/study">
            <a className={`px-4 py-3 flex items-center ${
              isActive("/study") 
                ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } transition-colors duration-200`}>
              <GraduationCap className="mr-3 h-5 w-5" /> Study
            </a>
          </Link>
          
          <Link href="/quiz">
            <a className={`px-4 py-3 flex items-center ${
              isActive("/quiz") 
                ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } transition-colors duration-200`}>
              <HelpCircle className="mr-3 h-5 w-5" /> Quiz
            </a>
          </Link>
          
          <Link href="/search">
            <a className={`px-4 py-3 flex items-center ${
              isActive("/search") 
                ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600 font-medium" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            } transition-colors duration-200`}>
              <Search className="mr-3 h-5 w-5" /> Search
            </a>
          </Link>
        </nav>
      </div>
      
      {/* Footer area for the sidebar - version info */}
      <div className="p-4 text-xs text-gray-500 border-t">
        <p>Flash日本語 v1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BarChart, Settings, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/components/auth/UserContext";

const Header = () => {
  const { user } = useUser();
  
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/">
            <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold text-blue-600">日本語Flash</h1>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" className="hidden md:flex" asChild>
            <Link href="/stats">
              <BarChart className="mr-1 h-4 w-4" />
              Stats
            </Link>
          </Button>

          <Button variant="ghost" className="hidden md:flex" asChild>
            <Link href="/settings">
              <Settings className="mr-1 h-4 w-4" />
              Settings
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-1"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.profilePicture || undefined} />
                    <AvatarFallback>{user.displayName?.[0] || user.username[0]}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">
                    {user.displayName || user.username}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <a href="/auth/logout">Log out</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              className="flex items-center space-x-1"
              onClick={() => window.location.href = '/auth/google'}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <span className="hidden md:inline">
                Sign in with Google
              </span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { handleRedirectResult } from "@/lib/auth";

// Define the User type based on our backend User schema
export interface User {
  id: number;
  username: string;
  email?: string;
  displayName?: string;
  profilePicture?: string;
  googleId?: string;
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: false,
  error: null,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<Error | null>(null);
  
  // Query for user data from our backend
  const { data: user, isLoading: userQueryLoading, error: userQueryError } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Handle Firebase authentication state changes
  useEffect(() => {
    // Check for redirect result on page load
    handleRedirectResult()
      .then((firebaseUser) => {
        if (firebaseUser) {
          // If Firebase auth redirected and authenticated successfully,
          // invalidate the user query to fetch updated user data
          queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        }
      })
      .catch((err) => {
        console.error("Firebase redirect error:", err);
        setFirebaseError(err as Error);
      })
      .finally(() => {
        setFirebaseLoading(false);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in, invalidate the user query
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      } else if (user) {
        // User is signed out but we have a user in state
        // Invalidate the user query to update state
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
      setFirebaseLoading(false);
    });

    return () => unsubscribe();
  }, [queryClient, user]);

  // Set up an interval to refresh the user data every 15 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }, 1000 * 60 * 15); // 15 minutes

    return () => clearInterval(intervalId);
  }, [queryClient]);

  const isLoading = userQueryLoading || firebaseLoading;
  const error = userQueryError || firebaseError;

  return (
    <UserContext.Provider value={{ user: user || null, isLoading, error: error as Error | null }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
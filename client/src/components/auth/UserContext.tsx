import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  const [initialLoading, setInitialLoading] = useState(true);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Query for user data from our backend
  const { data: user, isLoading: userQueryLoading, error: userQueryError } = useQuery<User | null>({
    queryKey: ['/api/user'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Check authentication status on mount and after redirects
  useEffect(() => {
    // Check for authentication status on page load
    handleRedirectResult()
      .then((serverUser) => {
        if (serverUser) {
          // If we got user data back from the server, make sure it's in our cache
          queryClient.setQueryData(['/api/user'], serverUser);
        }
      })
      .catch((err) => {
        console.error("Authentication check error:", err);
        setAuthError(err as Error);
      })
      .finally(() => {
        setInitialLoading(false);
      });
  }, [queryClient]);

  // Set up an interval to refresh the user data every 15 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    }, 1000 * 60 * 15); // 15 minutes

    return () => clearInterval(intervalId);
  }, [queryClient]);

  const isLoading = userQueryLoading || initialLoading;
  const error = userQueryError || authError;

  return (
    <UserContext.Provider value={{ user: user || null, isLoading, error: error as Error | null }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
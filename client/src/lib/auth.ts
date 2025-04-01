// Sign in with Google using Passport.js OAuth flow
export const signInWithGoogle = async () => {
  try {
    // Redirect to the server's Google Auth endpoint
    window.location.href = '/auth/google';
  } catch (error) {
    console.error("Error starting Google sign in:", error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await fetch("/auth/logout");
    window.location.href = '/';
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Fetch the current user from the server
export const getCurrentUser = async () => {
  try {
    const response = await fetch('/api/user');
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
};

// For compatibility with existing code
export const handleRedirectResult = async () => {
  return await getCurrentUser();
};

// Check if user is authenticated by making a server request
export const isAuthenticated = async () => {
  const user = await getCurrentUser();
  return user !== null;
};
import { signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

// Handle the redirect result from Google sign-in
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      // User successfully signed in
      const user = result.user;
      // Send user info to backend to create/update user in database
      await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          googleId: user.uid,
          email: user.email,
          displayName: user.displayName,
          profilePicture: user.photoURL,
        }),
      });
      return user;
    }
    return null;
  } catch (error) {
    console.error("Error handling redirect result:", error);
    throw error;
  }
};

// Sign out user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};
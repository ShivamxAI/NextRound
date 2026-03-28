import { auth } from "./firebase"; // Notice the import path is just "./firebase" now!

const API_URL = "http://127.0.0.1:8000/api";

export const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {

    await auth.authStateReady(); // Wait for Firebase Auth to initialize and determine if the user is logged in
  // 1. Check if the user is actually logged in
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // 2. Grab the fresh, secure ID token from Firebase
  const token = await user.getIdToken();

  // 3. Attach the token to the Headers
  const headers = {
    ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 4. Make the request to your FastAPI backend
  const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "API Request Failed");
  }
  
  return response.json();
};
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {jwtDecode} from "jwt-decode";
import { getCookie, removeCookie } from "@/actions/CookieUtils";

// Define the user interface based on your JWT token structure
interface User {
  id: string;
  roles: string[];
  userType: string;
  email: string;
  name: string;
  organizationId: string | null;
}

// Define the context state interface
interface UserContextState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: (userType:string) => void;
  decodeAndSetUser: (token: string) => void;
}

// Create the context with a default value
const UserContext = createContext<UserContextState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: () => {},
  decodeAndSetUser: () => {},
});

// Create a hook to use the user context
export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to decode JWT and set user
  const decodeAndSetUser = (token: string) => {
    try {
      // Decode the JWT token
      const decodedToken = jwtDecode<User>(token);

      // Set the user state
      setUser(decodedToken);

      return decodedToken;
    } catch (error) {
      console.error("Error decoding token:", error);
      setUser(null);
      return null;
    }
  };

  // Function to handle logout
  const logout = (userType: string) => {
    removeCookie("token");
    setUser(null);
    if (userType === "internal") {
      window.location.href = "/internal/login";
    } else {
      window.location.href = "/";
    }
  };

  // Check for token on initial load and page refreshes
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getCookie("token");

        if (token) {
          decodeAndSetUser(token);
        }
      } catch (error) {
        console.error("Authentication initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Derived authentication state
  const isAuthenticated = !!user;

  // Prepare the context value
  const contextValue: UserContextState = {
    user,
    isLoading,
    isAuthenticated,
    setUser,
    logout,
    decodeAndSetUser,
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
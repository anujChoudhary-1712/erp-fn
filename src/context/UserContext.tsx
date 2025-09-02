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
import OrgApis from "@/actions/Apis/OrgApis";

// Define the user interface based on your JWT token structure
interface User {
  orgName: string;
  id: string;
  roles: string[];
  userType: string;
  email: string;
  name: string;
  organizationId: string | null;
  status?: string;
}

// Define organization interface
interface Organization {
  _id: string;
  name: string;
  company_address?: string;
  logo?: string;
  prefixes: Array<{ title: string; format: string }>;
  type?: string;
  userIds: string[];
  settings: Record<string, any>;
  isActive: boolean;
  owner: any;
  createdAt: string;
  updatedAt: string;
}

// Define the context state interface
interface UserContextState {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: (userType: string) => void;
  decodeAndSetUser: (token: string) => void;
  fetchOrgDetails: (orgId: string) => Promise<Organization | null>;
}

// Create the context with a default value
const UserContext = createContext<UserContextState>({
  user: null,
  organization: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: () => {},
  logout: () => {},
  decodeAndSetUser: () => {},
  fetchOrgDetails: async () => null,
});

// Create a hook to use the user context
export const useUser = () => useContext(UserContext);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch organization details
  const fetchOrgDetails = async (orgId: string): Promise<Organization | null> => {
    try {
      console.log('Fetching organization details for ID:', orgId);
      const res = await OrgApis.getIndOrg(orgId);
      if (res.status === 200) {
        const orgData = res.data.organization;
        console.log('Organization data fetched:', orgData.name);
        return orgData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching organization details:', error);
      return null;
    }
  };

  // Function to decode JWT and set user
  const decodeAndSetUser = async (token: string) => {
    try {
      // Decode the JWT token
      const decodedToken = jwtDecode<User>(token);
      console.log('Decoded user token:', {
        name: decodedToken.name,
        userType: decodedToken.userType,
        organizationId: decodedToken.organizationId
      });

      // Set the user state first
      setUser(decodedToken);

      // If user is an organization user and has organizationId, fetch org details
      if (decodedToken.userType === 'organization' && decodedToken.organizationId) {
        console.log('Fetching organization details...');
        const orgData = await fetchOrgDetails(decodedToken.organizationId);
        if (orgData) {
          setOrganization(orgData);
          console.log('Organization set:', orgData.name);
        }
      } else {
        // Clear organization for internal users
        setOrganization(null);
      }

      return decodedToken;
    } catch (error) {
      console.error("Error decoding token:", error);
      setUser(null);
      setOrganization(null);
      return null;
    }
  };

  // Function to handle logout
  const logout = (userType: string) => {
    removeCookie("token");
    setUser(null);
    setOrganization(null);
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
          await decodeAndSetUser(token);
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
    organization,
    isLoading,
    isAuthenticated,
    setUser,
    logout,
    decodeAndSetUser,
    fetchOrgDetails
  };

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
};
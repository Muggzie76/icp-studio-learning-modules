import React, { createContext, useState, useEffect, useContext } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { icp_studio_backend } from '../../../declarations/icp_studio_backend';

// Create authentication context
const AuthContext = createContext();

// Create a provider component
export function AuthProvider({ children }) {
  const [authClient, setAuthClient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth client
  useEffect(() => {
    const initAuth = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);

        const isAuthenticated = await client.isAuthenticated();
        setIsAuthenticated(isAuthenticated);

        if (isAuthenticated) {
          const identity = client.getIdentity();
          setIdentity(identity);
          
          const principal = identity.getPrincipal();
          setPrincipal(principal);
          
          // Check if user is admin
          try {
            const adminStatus = await icp_studio_backend.isUserAdmin(principal);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error("Authentication initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Login function
  const login = async () => {
    if (!authClient) return;
    
    const days = BigInt(1);
    const hours = BigInt(24);
    const nanoseconds = BigInt(3600000000000);
    
    try {
      await authClient.login({
        identityProvider: process.env.DFX_NETWORK === 'ic' 
          ? 'https://identity.ic0.app/#authorize' 
          : 'http://localhost:8000?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai#authorize',
        maxTimeToLive: days * hours * nanoseconds,
        onSuccess: async () => {
          setIsAuthenticated(true);
          const identity = authClient.getIdentity();
          setIdentity(identity);
          
          const principal = identity.getPrincipal();
          setPrincipal(principal);
          
          // Check if user is admin
          try {
            const adminStatus = await icp_studio_backend.isUserAdmin(principal);
            setIsAdmin(adminStatus);
          } catch (error) {
            console.error("Error checking admin status:", error);
            setIsAdmin(false);
          }
        },
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  // Logout function
  const logout = async () => {
    if (!authClient) return;
    
    await authClient.logout();
    setIsAuthenticated(false);
    setIdentity(null);
    setPrincipal(null);
    setIsAdmin(false);
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        identity,
        principal,
        isAdmin,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
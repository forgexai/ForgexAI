"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import { defaultApiClient } from "@/lib/api-utils";
import { forgexAuthAtom, hasAttemptedAuthAtom } from "@/lib/state/atoms";

let lastSIWSData: { message: string; signature: string; timestamp: number } | null = null;

if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const [url, options] = args;
    
    if (typeof url === 'string' && url.includes('auth.privy.io/api/v1/siws/authenticate')) {
      try {
        const body = options?.body ? JSON.parse(options.body as string) : null;
        
        if (body?.message && body?.signature) {
          lastSIWSData = {
            message: body.message,
            signature: body.signature,
            timestamp: Date.now(),
          };
        }
      } catch (e) {
        console.error('[SIWS Interceptor] Failed to parse body:', e);
      }
    }
    
    return originalFetch(...args);
  };
}

export function usePrivyAuth() {
  const isAuthenticatingRef = useRef(false);
  const router = useRouter();
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkWallet,
    unlinkWallet,
    createWallet,
    exportWallet,
    getAccessToken,
  } = usePrivy();

  const { wallets } = useWallets();

  const [forgexAuth, setForgexAuth] = useAtom(forgexAuthAtom);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useAtom(hasAttemptedAuthAtom);

  const authenticateWithForgex = useCallback(async () => {
    if (!authenticated || hasAttemptedAuth || isAuthenticatingRef.current) {
      return;
    }

    isAuthenticatingRef.current = true;
    setHasAttemptedAuth(true);
    setForgexAuth(prev => ({ ...prev, isLoading: true }));

    try {
      const solanaAccount = user?.linkedAccounts?.find((account: any) => 
        account.type === 'wallet' && account.chainType === 'solana'
      );

      if (!solanaAccount) {
        throw new Error('No Solana wallet found. Please connect a Solana wallet to use ForgexAI.');
      }

      const walletAddress = (solanaAccount as any).address;
      const walletClient = (solanaAccount as any).walletClientType;

      let wallet = null;
      
      // First try to find wallet in the wallets array
      if (wallets && wallets.length > 0) {
        wallet = wallets.find((w: any) => 
          w.address?.toLowerCase() === walletAddress.toLowerCase()
        );
      }
      
      // If no wallet found in array, try to access Phantom directly
      if (!wallet && typeof window !== 'undefined' && (window as any).phantom?.solana) {
        const phantomWallet = (window as any).phantom.solana;
        
        if (phantomWallet.isConnected && phantomWallet.publicKey?.toString() === walletAddress) {
          wallet = {
            address: walletAddress,
            signMessage: async (message: Uint8Array) => {
              const { signature } = await phantomWallet.signMessage(message, 'utf8');
              return signature;
            }
          } as any;
        }
      }
      
      // If still no wallet, try to create a minimal wallet object for signing
      if (!wallet) {
        if (typeof window !== 'undefined' && (window as any).phantom?.solana) {
          const phantomWallet = (window as any).phantom.solana;
          if (phantomWallet.isConnected) {
            wallet = {
              address: walletAddress,
              signMessage: async (message: Uint8Array) => {
                try {
                  const { signature } = await phantomWallet.signMessage(message, 'utf8');
                  return signature;
                } catch (error) {
                  console.error('Error signing with Phantom:', error);
                  throw error;
                }
              }
            } as any;
          }
        }
      }
      
      if (!wallet) {
        throw new Error('Solana wallet not ready for signing. Please ensure Phantom is connected.');
      }

      if (!lastSIWSData) {
        setHasAttemptedAuth(false);
        setForgexAuth(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      const challengeResponse = await defaultApiClient.generateAuthChallenge(walletAddress);
      
      if (!challengeResponse.success || !challengeResponse.data) {
        throw new Error('Failed to generate auth challenge');
      }
 
      // Get the challenge message from the backend
      const challengeMessage = challengeResponse.data.message;
      const challengeTimestamp = challengeResponse.data.timestamp;
      
      // Use the SIWS signature and message (the ones that were actually signed)
      const bs58 = await import('bs58');
      const signatureBytes = Buffer.from(lastSIWSData.signature, 'base64');
      const signatureString = bs58.default.encode(signatureBytes);
      
      const siwsMessage = lastSIWSData.message;
      const siwsTimestamp = lastSIWSData.timestamp;
      
      const loginResponse = await defaultApiClient.loginWithWallet({
        walletAddress,
        signature: signatureString,
        message: siwsMessage,
        timestamp: siwsTimestamp,
      });

      if (!loginResponse.success || !loginResponse.data) {
        throw new Error(loginResponse.error || 'Failed to login with wallet');
      }


      defaultApiClient.setAuthToken(loginResponse.data.sessionToken);

      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', loginResponse.data.sessionToken);
      }

      setForgexAuth({
        isAuthenticated: true,
        sessionToken: loginResponse.data.sessionToken,
        user: loginResponse.data.user,
        isLoading: false,
      });


      router.push('/workflows');

    } catch (error: any) {
      setForgexAuth({
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
    } finally {
      isAuthenticatingRef.current = false;
    }
  }, [authenticated, wallets, hasAttemptedAuth, setForgexAuth, setHasAttemptedAuth]);

  
  // Check for existing session token on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !hasAttemptedAuth) {
      const storedToken = localStorage.getItem('authToken');
      
      if (storedToken) {
        // Set the token in the API client
        defaultApiClient.setAuthToken(storedToken);
        
        // Set auth state as authenticated
        setForgexAuth(prev => ({
          ...prev,
          isAuthenticated: true,
          sessionToken: storedToken,
          isLoading: false,
        }));
        setHasAttemptedAuth(true);
      }
    }
  }, [hasAttemptedAuth, setForgexAuth, setHasAttemptedAuth]);

  useEffect(() => {
    if (ready && authenticated && !hasAttemptedAuth) {
      if (wallets && wallets.length > 0) {
        authenticateWithForgex();
      } else {
        // Add a small delay to allow wallets to load
        const timeoutId = setTimeout(() => {
          if (!hasAttemptedAuth) {
            if (wallets && wallets.length > 0) {
              authenticateWithForgex();
            } else {
              authenticateWithForgex();
            }
          }
        }, 1000);
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, [ready, authenticated, wallets?.length, hasAttemptedAuth, authenticateWithForgex]);

  const enhancedLogout = useCallback(async () => {
    try {
      await defaultApiClient.logout();
      defaultApiClient.clearAuth();
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
      }

      setForgexAuth({
        isAuthenticated: false,
        isLoading: false,
      });
      setHasAttemptedAuth(false);
      isAuthenticatingRef.current = false;
    
      lastSIWSData = null;

      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout, setForgexAuth, setHasAttemptedAuth]);

  return {
    ready,
    authenticated,
    user,
    login,
    logout: enhancedLogout,
    linkWallet,
    unlinkWallet,
    createWallet,
    exportWallet,
    getAccessToken,
    wallets,
    forgexAuth,
  };
}

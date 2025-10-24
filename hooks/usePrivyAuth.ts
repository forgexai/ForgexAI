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
    
    console.log('🌐 Fetch interceptor - URL:', url);
    
    if (typeof url === 'string' && url.includes('auth.privy.io/api/v1/siws/authenticate')) {
      console.log('🎯 SIWS authentication call detected');
      try {
        const body = options?.body ? JSON.parse(options.body as string) : null;
        console.log('🔍 SIWS body:', { hasMessage: !!body?.message, hasSignature: !!body?.signature });
        
        if (body?.message && body?.signature) {
          lastSIWSData = {
            message: body.message,
            signature: body.signature,
            timestamp: Date.now(),
          };
          console.log('✅ SIWS data captured:', {
            hasMessage: !!lastSIWSData.message,
            hasSignature: !!lastSIWSData.signature,
            timestamp: lastSIWSData.timestamp
          });
        } else {
          console.log('❌ SIWS body missing message or signature');
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
    console.log('🔍 Auth Debug - Starting authenticateWithForgex:', {
      authenticated,
      walletsLength: wallets?.length,
      hasAttemptedAuth,
      isAuthenticating: isAuthenticatingRef.current,
      lastSIWSData: !!lastSIWSData,
      user: !!user,
      ready,
      environment: process.env.NODE_ENV
    });

    if (!authenticated || !wallets || !wallets.length || hasAttemptedAuth || isAuthenticatingRef.current) {
      console.log('❌ Early return due to conditions:', {
        authenticated,
        walletsLength: wallets?.length,
        hasAttemptedAuth,
        isAuthenticating: isAuthenticatingRef.current
      });
      return;
    }

    console.log('✅ All conditions passed, proceeding with authentication');

    isAuthenticatingRef.current = true;
    setHasAttemptedAuth(true);
    setForgexAuth(prev => ({ ...prev, isLoading: true }));

    try {
      console.log('🔍 Looking for Solana account in user linked accounts:', user?.linkedAccounts);
      
      const solanaAccount = user?.linkedAccounts?.find((account: any) => 
        account.type === 'wallet' && account.chainType === 'solana'
      );

      console.log('🔍 Found Solana account:', solanaAccount);

      if (!solanaAccount) {
        console.log('❌ No Solana wallet found in linked accounts');
        throw new Error('No Solana wallet found. Please connect a Solana wallet to use ForgexAI.');
      }

      const walletAddress = (solanaAccount as any).address;
      const walletClient = (solanaAccount as any).walletClientType;

      console.log('🔍 Wallet details:', { walletAddress, walletClient });

      let wallet = wallets.find((w: any) => 
        w.address?.toLowerCase() === walletAddress.toLowerCase()
      );
      
      console.log('🔍 Found wallet in wallets array:', !!wallet);
      
      if (!wallet && typeof window !== 'undefined' && (window as any).phantom?.solana) {
        console.log('🔍 Checking Phantom wallet directly');
        const phantomWallet = (window as any).phantom.solana;
        
        console.log('🔍 Phantom wallet state:', {
          isConnected: phantomWallet.isConnected,
          publicKey: phantomWallet.publicKey?.toString(),
          walletAddress
        });
        
        if (phantomWallet.isConnected && phantomWallet.publicKey?.toString() === walletAddress) {
          console.log('✅ Using Phantom wallet directly');
          wallet = {
            address: walletAddress,
            signMessage: async (message: Uint8Array) => {
              const { signature } = await phantomWallet.signMessage(message, 'utf8');
              return signature;
            }
          } as any;
        } else {
          console.log('❌ Phantom wallet not connected or address mismatch');
        }
      }
      
      if (!wallet) {
        console.log('❌ No wallet found for signing');
        throw new Error('Solana wallet not ready for signing. Please ensure Phantom is connected.');
      }

      console.log('✅ Wallet found, checking lastSIWSData:', {
        hasLastSIWSData: !!lastSIWSData,
        lastSIWSData: lastSIWSData ? {
          hasMessage: !!lastSIWSData.message,
          hasSignature: !!lastSIWSData.signature,
          timestamp: lastSIWSData.timestamp
        } : null
      });
 
      if (!lastSIWSData) {
        console.log('❌ No lastSIWSData found - authentication data not captured');
        setHasAttemptedAuth(false);
        setForgexAuth(prev => ({ ...prev, isLoading: false }));
        return;
      }
      
      console.log('🚀 Making API call 1: generateAuthChallenge');
      console.log('🔍 API Client config:', defaultApiClient.getConfig());
      
      const challengeResponse = await defaultApiClient.generateAuthChallenge(walletAddress);
      console.log('📡 Challenge response:', {
        success: challengeResponse.success,
        hasData: !!challengeResponse.data,
        error: challengeResponse.error,
        status: challengeResponse.status
      });
      
      if (!challengeResponse.success || !challengeResponse.data) {
        console.log('❌ Challenge generation failed');
        throw new Error('Failed to generate auth challenge');
      }
      
      console.log('✅ Challenge generated successfully');
 
      const bs58 = await import('bs58');
      const signatureBytes = Buffer.from(lastSIWSData.signature, 'base64');
      const signature = bs58.default.encode(signatureBytes);
      
      const issuedAtMatch = lastSIWSData.message.match(/Issued At: (.+)/);
      const issuedAtStr = issuedAtMatch ? issuedAtMatch[1].split('\n')[0] : null;
      const timestamp = issuedAtStr ? new Date(issuedAtStr).getTime() : Date.now();
      
      console.log('🔍 Signature processing:', {
        originalSignature: lastSIWSData.signature,
        processedSignature: signature,
        timestamp,
        message: lastSIWSData.message
      });
      
      console.log('🚀 Making API call 2: loginWithWallet');
      const loginResponse = await defaultApiClient.loginWithWallet({
        walletAddress,
        signature,
        message: lastSIWSData.message,
        timestamp,
      });

      console.log('📡 Login response:', {
        success: loginResponse.success,
        hasData: !!loginResponse.data,
        error: loginResponse.error,
        status: loginResponse.status
      });

      if (!loginResponse.success || !loginResponse.data) {
        console.log('❌ Login failed');
        throw new Error(loginResponse.error || 'Failed to login with wallet');
      }


      defaultApiClient.setAuthToken(loginResponse.data.sessionToken);

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('authToken', loginResponse.data.sessionToken);
      }

      setForgexAuth({
        isAuthenticated: true,
        sessionToken: loginResponse.data.sessionToken,
        user: loginResponse.data.user,
        isLoading: false,
      });


      router.push('/workflows');

    } catch (error: any) {
      console.error('Authentication error:', error);
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
    console.log('🔍 Checking for stored session token:', {
      hasWindow: typeof window !== 'undefined',
      hasAttemptedAuth,
      hasStoredToken: typeof window !== 'undefined' ? !!sessionStorage.getItem('authToken') : false
    });
    
    if (typeof window !== 'undefined' && !hasAttemptedAuth) {
      const storedToken = sessionStorage.getItem('authToken');
      console.log('🔍 Stored token found:', !!storedToken);
      
      if (storedToken) {
        console.log('✅ Using stored session token');
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
      } else {
        console.log('❌ No stored session token found');
      }
    }
  }, [hasAttemptedAuth, setForgexAuth, setHasAttemptedAuth]);

  useEffect(() => {
    console.log('🔄 Auth useEffect triggered:', {
      ready,
      authenticated,
      walletsLength: wallets?.length,
      hasAttemptedAuth,
      shouldAuthenticate: ready && authenticated && wallets && wallets.length > 0 && !hasAttemptedAuth
    });
    
    if (ready && authenticated && wallets && wallets.length > 0 && !hasAttemptedAuth) {
      console.log('🚀 Triggering authenticateWithForgex from useEffect');
      authenticateWithForgex();
    }
  }, [ready, authenticated, wallets?.length, hasAttemptedAuth, authenticateWithForgex]);

  const enhancedLogout = useCallback(async () => {
    try {

      await defaultApiClient.logout();
      defaultApiClient.clearAuth();
      
      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('authToken');
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

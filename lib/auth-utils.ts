// Authentication utilities for ForgexAI integration
import { defaultApiClient } from './api-utils';

export interface AuthChallenge {
  message: string;
  timestamp: number;
  walletAddress: string;
}

export interface AuthResult {
  success: boolean;
  sessionToken?: string;
  user?: any;
  error?: string;
}

/**
 * Generate an authentication challenge for a wallet address
 */
export async function generateAuthChallenge(walletAddress: string): Promise<AuthChallenge | null> {
  try {
    const response = await defaultApiClient.generateAuthChallenge(walletAddress);
    
    if (!response.success || !response.data) {
      return null;
    }
    
    return response.data;
  } catch (error) {
    return null;
  }
}

/**
 * Authenticate with wallet signature
 */
export async function authenticateWithWallet(
  walletAddress: string,
  signature: string,
  message: string,
  timestamp: number
): Promise<AuthResult> {
  try {
    const response = await defaultApiClient.loginWithWallet({
      walletAddress,
      signature,
      message,
      timestamp,
    });
    
    if (!response.success || !response.data) {
      return {
        success: false,
        error: response.error || 'Authentication failed',
      };
    }
    
    defaultApiClient.setAuthToken(response.data.sessionToken);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem('authToken', response.data.sessionToken);
    }
    
    return {
      success: true,
      sessionToken: response.data.sessionToken,
      user: response.data.user,
    };
  } catch (error: any) {
    console.error('Error authenticating with wallet:', error);
    return {
      success: false,
      error: error.message || 'Authentication failed',
    };
  }
}

/**
 * Logout from ForgexAI backend
 */
export async function logoutFromForgex(): Promise<void> {
  try {
    await defaultApiClient.logout();
  } catch (error) {
    console.error('Error logging out from ForgexAI:', error);
  } finally {
    defaultApiClient.clearAuth();
    
    // Clear session storage
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('authToken');
    }
  }
}

/**
 * Get session token from session storage
 */
export function getStoredSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('authToken');
}

/**
 * Check if user is authenticated with ForgexAI
 */
export function isForgexAuthenticated(): boolean {
  const apiToken = defaultApiClient.getConfig().authToken;
  const storedToken = getStoredSessionToken();
  return !!(apiToken || storedToken);
}

/**
 * Get the current ForgexAI session token
 */
export function getForgexSessionToken(): string | undefined {
  const apiToken = defaultApiClient.getConfig().authToken;
  const storedToken = getStoredSessionToken();
  return apiToken || storedToken || undefined;
}

// Authentication utilities for ForgexAI integration
import { defaultApiClient } from './api-utils';
import { logAuthFlow, logError } from './debug-auth';

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
    logAuthFlow('Calling generateAuthChallenge API for:', walletAddress);
    const response = await defaultApiClient.generateAuthChallenge(walletAddress);
    
    if (!response.success || !response.data) {
      logError('Failed to generate auth challenge:', response.error);
      return null;
    }
    
    logAuthFlow('Auth challenge generated successfully');
    return response.data;
  } catch (error) {
    logError('Error generating auth challenge:', error);
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
    
    // Store the session token
    defaultApiClient.setAuthToken(response.data.sessionToken);
    
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
  }
}

/**
 * Check if user is authenticated with ForgexAI
 */
export function isForgexAuthenticated(): boolean {
  return !!defaultApiClient.getConfig().authToken;
}

/**
 * Get the current ForgexAI session token
 */
export function getForgexSessionToken(): string | undefined {
  return defaultApiClient.getConfig().authToken;
}

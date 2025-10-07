"use client";

import { usePrivy } from "@privy-io/react-auth";

export function usePrivyAuth() {
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

  return {
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
  };
}

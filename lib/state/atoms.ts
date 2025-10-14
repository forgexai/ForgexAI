import { atom } from "jotai";
import { Node, Edge } from "reactflow";

export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);
export const selectedNodeAtom = atom<Node | null>(null);
export const userAtom = atom<any>(null);
export const workspaceAtom = atom<Record<string, any>>({});

export interface ForgexAuthState {
  isAuthenticated: boolean;
  sessionToken?: string;
  user?: any;
  isLoading: boolean;
  error?: string;
}

export const forgexAuthAtom = atom<ForgexAuthState>({
  isAuthenticated: false,
  isLoading: false,
});

export const hasAttemptedAuthAtom = atom<boolean>(false);
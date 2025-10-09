import { atom } from "jotai";
import { Node, Edge } from "reactflow";

export const nodesAtom = atom<Node[]>([]);
export const edgesAtom = atom<Edge[]>([]);
export const selectedNodeAtom = atom<Node | null>(null);
export const userAtom = atom<any>(null);
export const workspaceAtom = atom<Record<string, any>>({});

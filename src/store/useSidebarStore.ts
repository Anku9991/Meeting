import { create } from "zustand";

interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsOpen: (open) => set({ isOpen: open }),
}));

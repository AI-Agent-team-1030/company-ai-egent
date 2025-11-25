import { create } from 'zustand'

interface SidebarState {
  isMobileOpen: boolean
  openMobileSidebar: () => void
  closeMobileSidebar: () => void
  toggleMobileSidebar: () => void
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isMobileOpen: false,
  openMobileSidebar: () => set({ isMobileOpen: true }),
  closeMobileSidebar: () => set({ isMobileOpen: false }),
  toggleMobileSidebar: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
}))

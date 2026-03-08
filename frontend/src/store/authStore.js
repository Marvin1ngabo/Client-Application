import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      deviceVerified: false,

      setAuth: (user, accessToken, deviceVerified) =>
        set({ user, accessToken, isAuthenticated: true, deviceVerified }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, deviceVerified: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

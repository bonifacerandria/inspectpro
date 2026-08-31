import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import apiClient from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      chargement: false,
      erreur: null,

      estConnecte: () => Boolean(get().token),

      /**
       * Retourne true en cas de succès (la page Login s'en sert pour
       * naviguer), false sinon — l'erreur lisible reste dans `erreur`.
       */
      login: async (email, motDePasse) => {
        set({ chargement: true, erreur: null })
        try {
          const { data } = await apiClient.post('/login', {
            email,
            password: motDePasse,
          })
          set({ token: data.token, user: data.user, chargement: false })
          return true
        } catch (err) {
          const message =
            err.response?.data?.errors?.email?.[0] ||
            err.response?.data?.message ||
            'Une erreur est survenue. Réessayez.'
          set({ chargement: false, erreur: message })
          return false
        }
      },

      logout: async () => {
        try {
          await apiClient.post('/logout')
        } catch {
          // Même si l'appel échoue (token déjà invalide côté serveur),
          // on nettoie systématiquement l'état local.
        } finally {
          set({ token: null, user: null })
        }
      },

      /** Nettoyage local uniquement, sans appel API (utilisé par l'intercepteur 401). */
      deconnexion: () => set({ token: null, user: null }),
    }),
    {
      name: 'inspection-levage-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)

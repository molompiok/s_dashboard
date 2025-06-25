/// pages/login/AuthStore.ts
import { create } from "zustand";
import { UserInterface } from "../Interfaces/Interfaces";
import { combine } from "zustand/middleware";
import { navigate } from "vike/client/router";

// Clés de stockage local
const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const useAuthStore = create(
  combine(
    {
      token: undefined as string | undefined,
      user: undefined as Partial<UserInterface> | undefined
    },
    (set, get) => ({
      setToken(token: string | undefined | null) {
        try {
          set({ token: token || undefined });
          if (typeof window !== "undefined") {
            if (token) {
              localStorage.setItem(TOKEN_KEY, token);
            } else if (token == null) {
              localStorage.removeItem(TOKEN_KEY);
            }
          }
        } catch (e) {
          console.error("Erreur dans setToken:", e);
        }
      },

      getToken(): string | undefined {
        try {
          if (get().token) return get().token;
          if (typeof window !== "undefined") {
            const t = localStorage.getItem(TOKEN_KEY) ?? undefined;
            t && set({ token: t || undefined });
            return t
          }
        } catch (e) {
          console.error("Erreur dans getToken:", e);
        }
        return undefined;
      },

      setUser(user: Partial<UserInterface> | undefined | null) {
        try {
          set({ user: user || undefined });
          if (typeof window !== "undefined") {
            if (user) {
              localStorage.setItem(USER_KEY, JSON.stringify(user));
            } else if (user == null) {
              localStorage.removeItem(USER_KEY);
            }
          }
        } catch (e) {
          console.error("Erreur dans setUser:", e);
        }
      },

      getUser(): Partial<UserInterface> | undefined {
        try {
          if (get().user) return get().user;
          if (typeof window !== "undefined") {
            let user = localStorage.getItem(USER_KEY);
            const u  = user ? JSON.parse(user) : undefined;
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            u && set({user:u})
            return u;
          }
        } catch (e) {
          console.error("Erreur dans getUser:", e);
        }
        return undefined;
      },
      logoutGlobal: () => {
        set(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          // Ajouter d'autres nettoyages si nécessaire
          return { token: undefined, user: undefined }; // Mettre à jour l'état Zustand
        });
      }
    })
  )
);

// Fonctions d'accès direct
export function getToken(): string | undefined {
  const token = useAuthStore.getState().getToken();
  return token
}

export function getUser(): Partial<UserInterface> | undefined {
  return useAuthStore.getState().getUser();
}

export function logoutUserGlobally() {
  useAuthStore.getState().logoutGlobal();
}

export function handleUnauthorized() {
  logoutUserGlobally();
  navigate('/auth/login?sessionExpired=true');
}

/*

on tombe directement sur la page detail product (le 1 erer produit de la categorie si definie par le owner dans les config  ou le 1erer produit du store (sans categories_id))  on peut aussi definir un produit par defaut il faudra doonc tester la condition.


*/
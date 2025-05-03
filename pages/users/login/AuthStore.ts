/// pages/login/AuthStore.ts
import { create } from "zustand";
import { UserInterface } from "../../../Interfaces/Interfaces";
import { combine } from "zustand/middleware";
import { ClientCall } from "../../../Components/Utils/functions";

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
      setToken(token: string | undefined) {
        try {
          set({ token });
          if (typeof window !== "undefined") {
            if (token) {
              localStorage.setItem(TOKEN_KEY, token);
            } else {
              // localStorage.removeItem(TOKEN_KEY);
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
            return  localStorage.getItem(TOKEN_KEY) ?? undefined;
          }
        } catch (e) {
          console.error("Erreur dans getToken:", e);
        }
        return undefined;
      },

      setUser(user: Partial<UserInterface> | undefined) {
        try {
          set({ user });
          if (typeof window !== "undefined") {
            if (user) {
              localStorage.setItem(USER_KEY, JSON.stringify(user));
            } else {
              // localStorage.removeItem(USER_KEY);
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
            const stored = localStorage.getItem(USER_KEY);
            return stored ? JSON.parse(stored) : undefined;
          }
        } catch (e) {
          console.error("Erreur dans getUser:", e);
        }
        return undefined;
      },
      logoutGlobal: () => {
        set(() => {
          // _token = undefined;
          // _user = undefined;
          // localStorage.removeItem(TOKEN_KEY);
          // localStorage.removeItem(USER_KEY);
          // Ajouter d'autres nettoyages si nécessaire
          return { token: undefined, user: undefined }; // Mettre à jour l'état Zustand
        });
      }
    })
  )
);

// Fonctions d'accès direct
export function getToken(): string | undefined {
  const eeeeeeeeeeeeeeeee = useAuthStore.getState().getToken();
  console.log({ eeeeeeeeeeeeeeeee });

  return eeeeeeeeeeeeeeeee
}

export function getUser(): Partial<UserInterface> | undefined {
  return useAuthStore.getState().getUser();
}

export function logoutUserGlobally() {
  useAuthStore.getState().logoutGlobal();
}

export function handleUnauthorized() {
  console.log("Global 401 handler triggered. Logging out.");
  logoutUserGlobally();
  window.location.href = '/login?sessionExpired=true';
}
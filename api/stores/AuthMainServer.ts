/// pages/login/AuthStore.ts
import { create } from "zustand";
import { UserInterface } from "../../api/Interfaces/Interfaces";
import { combine } from "zustand/middleware";
import { ClientCall } from "../../Components/Utils/functions";
import { navigate } from "vike/client/router";

// Clés de stockage local
const TOKEN_KEY = "auth_mainSeverToken";
const USER_KEY = "auth_mainSeverUser";

export const useAuthMainZust = create(
  combine(
    {
      mainSeverToken: undefined as string | undefined,
      mainSeverUser: undefined as Partial<UserInterface> | undefined
    },
    (set, get) => ({
      setMainServerToken(mainSeverToken: string | undefined) {
        try {
          set({ mainSeverToken });
          if (typeof window !== "undefined") {
            if (mainSeverToken) {
              localStorage.setItem(TOKEN_KEY, mainSeverToken);
            } else {
              // localStorage.removeItem(TOKEN_KEY);
            }
          }
        } catch (e) {
          console.error("Erreur dans setToken:", e);
        }
      },

      getMainServerToken(): string | undefined {
        try {
          if (get().mainSeverToken) return get().mainSeverToken;
          if (typeof window !== "undefined") {
            return localStorage.getItem(TOKEN_KEY) ?? undefined;
          }
        } catch (e) {
          console.error("Erreur dans getToken:", e);
        }
        return undefined;
      },

      setMainServerUser(mainSeverUser: Partial<UserInterface> | undefined) {
        try {
          set({ mainSeverUser });
          if (typeof window !== "undefined") {
            if (mainSeverUser) {
              localStorage.setItem(USER_KEY, JSON.stringify(mainSeverUser));
            } else {
              // localStorage.removeItem(USER_KEY);
            }
          }
        } catch (e) {
          console.error("Erreur dans setUser:", e);
        }
      },

      getMainServerUser(): Partial<UserInterface> | undefined {
        try {
          if (get().mainSeverUser) return get().mainSeverUser;
          if (typeof window !== "undefined") {
            const stored = localStorage.getItem(USER_KEY);
            return stored ? JSON.parse(stored) : undefined;
          }
        } catch (e) {
          console.error("Erreur dans getUser:", e);
        }
        return undefined;
      },
      logoutMainServerGlobal: () => {
        set(() => {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          return { mainSeverToken: undefined, mainSeverUser: undefined };
        });
      }
    })
  )
);

// Fonctions d'accès direct
export function getMainServerToken(): string | undefined {
  const getMainServerToken = useAuthMainZust.getState().getMainServerToken();
  console.log({ getMainServerToken });

  return getMainServerToken
}

export function getMainServerUser(): Partial<UserInterface> | undefined {
  return useAuthMainZust.getState().getMainServerUser();
}

export function logoutMainServerUserGlobally() {
  useAuthMainZust.getState().logoutMainServerGlobal();
}

export function handleUnauthorized() {
  console.log("Global 401 handler triggered. Logging out.");
  logoutMainServerUserGlobally();
  navigate('/auth/login?sessionExpired=true');
}
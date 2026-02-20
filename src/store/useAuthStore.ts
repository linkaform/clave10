import { create } from "zustand";
import { useAccessStore } from "./useAccessStore";
import { useAreasLocationStore } from "./useGetAreaLocationByUser";
import { useMenuStore } from "./useGetMenuStore";
import { useGuardSelectionStore } from "./useGuardStore";
import { useShiftStore } from "./useShiftStore";

interface AuthState {
  token: string | null;
  userId: string | null;
  userNameSoter : string | null;
  userEmailSoter : string | null;
  userIdSoter: number;
  userPhoto:string| null;
  userParentId:number | null;
  isAuth: boolean;
  
  setAuth: (token: string, userId: string, userNameSoter: string, userEmailSoter: string, userIdSoter: number, userPhoto:string, userParentId:number) => void;
  setUserPhoto: (photoUrl: string) => void;
  logout: (queryClient?: any) => void;
}

const useAuthStore = create<AuthState>((set) => {
  // Leer valores desde localStorage al inicializar el store
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
  const userNameSoter = typeof window !== "undefined" ? localStorage.getItem("userName_soter") : null;
  const userEmailSoter = typeof window !== "undefined" ? localStorage.getItem("userEmail_soter") : null;
  const userPhoto = typeof window !== "undefined" ? localStorage.getItem("userPhoto_soter") : null;
  const userIdSoter = typeof window !== "undefined" ? parseInt(localStorage.getItem("userId_soter") || "") : 0;
  const userParentId = typeof window !== "undefined" ? parseInt(localStorage.getItem("userParentId_soter") || "") : 0;
  const isAuth = !!token; // isAuth es true si hay un token

  return {
    token,
    userId,
    userNameSoter,
    userEmailSoter,
    userIdSoter,
    userPhoto,
    userParentId,
    isAuth,

    setAuth: (token: string, userId: string, userNameSoter: string, userEmailSoter: string, userIdSoter:number, userPhoto:string, userParentId:number) => {
      // Guarda los valores en localStorage
      localStorage.setItem("access_token", token);
      localStorage.setItem("user_id", userId);
      localStorage.setItem("userName_soter", userNameSoter);
      localStorage.setItem("userEmail_soter", userEmailSoter);
      localStorage.setItem("userId_soter", userIdSoter.toString() );
      localStorage.setItem("userPhoto_soter", userPhoto);
      localStorage.setItem("userParentId_soter", userParentId.toString() );
      // Actualiza el estado
      set({ token, userId, userNameSoter, userEmailSoter, userIdSoter,isAuth: true , userPhoto, userParentId });
    },

    setUserPhoto: (photoUrl: string) => {
      localStorage.setItem("userPhoto_soter", photoUrl);
      set({ userPhoto: photoUrl });
    },

    logout: (queryClient?: any) => {
      window.location.href = '/auth/login';
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_id");
      if (queryClient) {
        queryClient.removeQueries({ queryKey: ['serchPass'] });
      }
    
      localStorage.removeItem("userName_soter");
      localStorage.removeItem("userEmail_soter");
      localStorage.removeItem("userId_soter" );
      localStorage.removeItem("userPhoto_soter");
      localStorage.removeItem("userParentId_soter");
 
      set({ token: null, userId: null,userNameSoter: null, userEmailSoter: null, userIdSoter: 0 ,isAuth: false , userPhoto:null, userParentId:null});
      useAccessStore.getState().clearPassCode();
      useAreasLocationStore.getState().clearAreasLocation();
      useMenuStore.getState().clearMenu();
      useGuardSelectionStore.getState().clearSelectedGuards();
      useShiftStore.getState().clearShift();
      localStorage.clear();
    },
  };
});

export default useAuthStore;

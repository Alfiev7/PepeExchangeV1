import { create } from "zustand";

const ADMIN_ID = "670d13965eaf3d64463679f7";

interface StoreState {
  userID: string | null;
  isAdmin: boolean;
  setUserID: (id: string) => void;
  checkAdminStatus: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  userID: null,
  isAdmin: false,
  setUserID: (id: string) => {
    set({ userID: id });
    get().checkAdminStatus();
  },
  checkAdminStatus: () => set({ isAdmin: get().userID === ADMIN_ID }),
}));

export default useStore;

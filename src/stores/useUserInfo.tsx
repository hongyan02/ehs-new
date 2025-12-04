import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserInfoState {
  username: string;
  nickname: string;
  deptName: string;
  permissions: string[];
  setInfo: (info: Partial<UserInfoState>) => void;
  clearInfo: () => void;
}

const useInfoStore = create<UserInfoState>()(
  persist(
    (set) => ({
      username: "",
      nickname: "",
      deptName: "",
      permissions: [],
      setInfo: (info) => set((state) => ({ ...state, ...info })),
      clearInfo: () => set({ username: "", nickname: "", deptName: "", permissions: [] }),
    }),
    {
      name: "user-info-storage",
    }
  )
);

export default useInfoStore;

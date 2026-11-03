import React from "react";
import { AuthStore } from "./stores/AuthStore";

export interface IStoreContext {
  authStore: AuthStore;
}

const authStore = new AuthStore();

export const StoreContext = React.createContext<IStoreContext>({
  authStore,
})
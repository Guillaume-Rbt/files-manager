import { createActiveStore } from "./createActiveStore";

const activeFolderStore = createActiveStore("/");

export const setActiveFolderId = activeFolderStore.setActiveId;
export const useFolderActive = activeFolderStore.useActiveId;

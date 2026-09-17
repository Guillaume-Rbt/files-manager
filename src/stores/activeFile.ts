import { createActiveStore } from "./createActiveStore";

const activeFileStore = createActiveStore(null);

export const setActiveFileId = activeFileStore.setActiveId;
export const useFileActive = activeFileStore.useActiveId;

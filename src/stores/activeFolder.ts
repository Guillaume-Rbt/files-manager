import { useSyncExternalStore } from "preact/compat";

let activeFolderId: string | null = "/";
const listeners = new Set<() => void>();

function getActiveFolderId() {
    return activeFolderId;
}

export function setActiveFolderId(id: string | null) {
    if (id === activeFolderId) {
        return;
    }

    activeFolderId = id;
    listeners.forEach((listener) => listener());
}

function subscribeActiveFolder(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

export function useFolderActive(): string | null {
    return useSyncExternalStore(subscribeActiveFolder, getActiveFolderId);
}

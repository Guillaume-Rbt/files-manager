import { useSyncExternalStore } from "preact/compat";
import { FilesManager } from "../files-manager";
import type { FolderType } from "../types";

type FolderState = {
    folders: FolderType[];
    loading: boolean;
    error: Error | null;
    fetched: boolean;
};

let state: FolderState = {
    folders: [],
    loading: false,
    error: null,
    fetched: false,
};
const listeners = new Set<() => void>();
let request: Promise<void> | null = null;

function notify() {
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

async function fetchFolders() {
    if (request) {
        return request;
    }

    state = { ...state, loading: true, error: null };
    notify();

    request = fetch(`${FilesManager.endPoint}/folders`)
        .then(async (response) => {
            if (!response.ok) {
                throw new Error("Impossible de charger les dossiers.");
            }

            state = {
                folders: (await response.json()) as FolderType[],
                loading: false,
                error: null,
                fetched: true,
            };
        })
        .catch((error) => {
            state = {
                ...state,
                loading: false,
                error:
                    error instanceof Error ? error : new Error(String(error)),
                fetched: true,
            };
        })
        .finally(() => {
            request = null;
            notify();
        });

    return request;
}

export function useFolders() {
    const currentState = useSyncExternalStore(subscribe, () => state);

    if (!currentState.fetched && !request) {
        void fetchFolders();
    }

    return currentState;
}

export function addFolderToCache(folder: FolderType) {
    state = {
        ...state,
        folders: [...state.folders, folder].sort((a, b) =>
            a.id.localeCompare(b.id),
        ),
        fetched: true,
    };
    notify();
}

export function removeFolderFromCache(folderId: string) {
    state = {
        ...state,
        folders: state.folders.filter(
            (folder) =>
                folder.id !== folderId && !folder.id.startsWith(`${folderId}/`),
        ),
    };
    notify();
}

export function renameFolderInCache(
    folderId: string,
    renamedFolder: FolderType,
) {
    const descendantPrefix = `${folderId}/`;
    const renamedPrefix = `${renamedFolder.id}/`;

    state = {
        ...state,
        folders: state.folders.map((folder) => {
            if (folder.id === folderId) {
                return renamedFolder;
            }

            if (folder.id.startsWith(descendantPrefix)) {
                const id = `${renamedPrefix}${folder.id.slice(descendantPrefix.length)}`;
                const parent = folder.parent?.startsWith(descendantPrefix)
                    ? `${renamedPrefix}${folder.parent.slice(descendantPrefix.length)}`
                    : folder.parent;

                return { ...folder, id, parent };
            }

            return folder;
        }),
    };
    notify();
}

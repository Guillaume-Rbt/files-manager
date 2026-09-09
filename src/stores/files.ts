import { useSyncExternalStore } from "preact/compat";
import { FilesManager } from "../files-manager";
import type { FileType } from "../types";

type FolderState = {
    files: FileType[];
    loading: boolean;
    ok: boolean;
    fetched: boolean;
};

const initialState: FolderState = {
    files: [],
    loading: false,
    ok: true,
    fetched: false,
};

const folderStates = new Map<string | null, FolderState>();
const pendingFetches = new Set<string | null>();
const listeners = new Set<() => void>();

function notify() {
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getFolderState(folder: string | null): FolderState {
    return folderStates.get(folder) ?? initialState;
}

function setFolderState(
    folder: string | null,
    patch:
        | Partial<FolderState>
        | ((current: FolderState) => Partial<FolderState>),
) {
    const current = getFolderState(folder);
    const resolvedPatch = typeof patch === "function" ? patch(current) : patch;

    folderStates.set(folder, { ...current, ...resolvedPatch });
    notify();
}

async function fetchFolderFiles(folder: string | null) {
    if (pendingFetches.has(folder)) {
        return;
    }

    pendingFetches.add(folder);
    // Snapshot the files reference so we can detect an optimistic update
    // (add/remove) that happened while this request was in flight.
    const filesBeforeFetch = getFolderState(folder).files;
    setFolderState(folder, { loading: true });

    try {
        const response = await fetch(
            `${FilesManager.endPoint}/files?parent=${folder ?? ""}`,
        );
        const data = (await response.json()) as FileType[];

        setFolderState(folder, (current) => {
            if (current.files !== filesBeforeFetch) {
                // An optimistic update already changed the files, keep it.
                return { ok: response.ok, loading: false, fetched: true };
            }

            return {
                files: data,
                ok: response.ok,
                loading: false,
                fetched: true,
            };
        });
    } catch {
        setFolderState(folder, { ok: false, loading: false, fetched: true });
    } finally {
        pendingFetches.delete(folder);
    }
}

export function useFiles(folder: string | null) {
    const state = useSyncExternalStore(subscribe, () => getFolderState(folder));

    if (!state.fetched && !pendingFetches.has(folder)) {
        fetchFolderFiles(folder);
    }

    return { files: state.files, loading: state.loading, ok: state.ok };
}

export function addFilesToCache(folder: string | null, newFiles: FileType[]) {
    const updated = [...getFolderState(folder).files, ...newFiles].sort(
        (a, b) => a.name.localeCompare(b.name),
    );

    setFolderState(folder, { files: updated, fetched: true });

    return updated;
}

export function removeFileFromCache(folder: string | null, fileId: string) {
    const updated = getFolderState(folder).files.filter(
        (file) => file.id !== fileId,
    );

    setFolderState(folder, { files: updated });

    return updated;
}

import { useSyncExternalStore } from "preact/compat";

type Listener = () => void;

export function createActiveStore(initialId: string | null) {
    let activeId = initialId;
    const listeners = new Set<Listener>();

    function getActiveId() {
        return activeId;
    }

    function setActiveId(id: string | null) {
        if (id === activeId) {
            return;
        }

        activeId = id;
        listeners.forEach((listener) => listener());
    }

    function subscribe(listener: Listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function useActiveId(): string | null {
        return useSyncExternalStore(subscribe, getActiveId);
    }

    return { setActiveId, useActiveId };
}

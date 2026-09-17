import { useModalContext } from "./useModalContext";

export function useAlert() {
    const modal = useModalContext();

    return (options: { title?: string; message: string }) =>
        modal({
            ...options,
            buttons: [{ label: "OK", type: "primary", action: "resolve" }],
        });
}

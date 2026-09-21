import { useModalContext } from "./useModalContext";

export function useConfirm() {
    const modal = useModalContext();

    return (options: { title?: string; message: string; confirmText?: string; cancelText?: string }) =>
        modal({
            ...options,
            buttons: [
                { label: options.confirmText || "Confirmer", type: "secondary", action: "resolve" },
                { label: options.cancelText || "Annuler", type: "primary", action: "reject" },
            ],
        });
}

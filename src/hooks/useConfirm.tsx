import { useModalContext } from "./useModalContext";

export function useConfirm() {
    const modal = useModalContext();

    return (options: { title?: string; message: string }) =>
        modal({
            ...options,
            buttons: [
                { label: "Confirmer", type: "primary", action: "resolve" },
                { label: "Annuler", type: "secondary", action: "reject" },
            ],
        });
}

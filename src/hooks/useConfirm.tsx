import { useModalContext } from "./useModalContext";
import { translation } from "../utils/functions";

export function useConfirm() {
    const modal = useModalContext();

    return (options: { title?: string; message: string; confirmText?: string; cancelText?: string }) =>
        modal({
            ...options,
            buttons: [
                { label: options.confirmText || translation("confirm"), type: "secondary", action: "resolve" },
                { label: options.cancelText || translation("cancel"), type: "primary", action: "reject" },
            ],
        });
}

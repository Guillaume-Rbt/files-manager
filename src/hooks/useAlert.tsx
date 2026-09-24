import { useModalContext } from "./useModalContext";
import { translation } from "../utils/functions";

export function useAlert() {
    const modal = useModalContext();

    return (options: { title?: string; message: string }) =>
        modal({
            ...options,
            buttons: [{ label: translation("ok"), type: "primary", action: "resolve" }],
        });
}

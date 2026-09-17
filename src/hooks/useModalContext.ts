import { useContext } from "preact/hooks";
import { ModalContext } from "../ui/Modals";

export function useModalContext() {
    const modal = useContext(ModalContext);

    if (!modal) {
        throw new Error("Ce hook doit être utilisé dans un ModalProvider");
    }

    return modal;
}

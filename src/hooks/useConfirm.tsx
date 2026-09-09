import { useContext, useRef, useState } from "preact/hooks";
import { ComponentChildren, createContext } from "preact";

type ConfirmFunction = (message: string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFunction | null>(null);

export function ConfirmProvider({ children }: { children: ComponentChildren }) {
    const [message, setMessage] = useState<string | null>(null);

    const resolver = useRef<((value: boolean) => void) | null>(null);

    const confirm = (message: string): Promise<boolean> => {
        setMessage(message);

        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    };

    const handleConfirm = () => {
        resolver.current?.(true);
        resolver.current = null;
        setMessage(null);
    };

    const handleCancel = () => {
        resolver.current?.(false);
        resolver.current = null;
        setMessage(null);
    };

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}

            {message && (
                <div className='confirm-overlay'>
                    <div className='confirm-modal'>
                        <p>{message}</p>

                        <button onClick={handleCancel}>Annuler</button>

                        <button onClick={handleConfirm}>Confirmer</button>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const confirm = useContext(ConfirmContext);

    if (!confirm) {
        throw new Error("useConfirm doit être utilisé dans ConfirmProvider");
    }

    return confirm;
}

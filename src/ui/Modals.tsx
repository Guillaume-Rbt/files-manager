import { useRef, useState } from "preact/hooks";
import { ComponentChildren, createContext } from "preact";

type ModalContext = (options: {
    title?: string;
    message: string;
    buttons: { label: string; type: "primary" | "secondary"; action: "resolve" | "reject" }[];
}) => Promise<boolean>;

export const ModalContext = createContext<ModalContext | null>(null);

export function ModalProvider({ children }: { children: ComponentChildren }) {
    const [message, setMessage] = useState<string | null>(null);
    const [title, setTitle] = useState<string | null>(null);
    const [buttons, setButtons] = useState<
        { label: string; type: "primary" | "secondary"; action: "resolve" | "reject" }[] | null
    >(null);

    const resolver = useRef<((value: boolean) => void) | null>(null);

    const createModal = (options: {
        title?: string;
        message: string;
        buttons: { label: string; type: "primary" | "secondary"; action: "resolve" | "reject" }[];
    }): Promise<boolean> => {
        setTitle(options.title || "");
        setMessage(options.message);
        setButtons(options.buttons);

        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    };

    const handleResolve = () => {
        resolver.current?.(true);
        resolver.current = null;
        setMessage(null);
        setTitle(null);
        setButtons(null);
    };

    const handleReject = () => {
        resolver.current?.(false);
        resolver.current = null;
        setMessage(null);
        setTitle(null);
        setButtons(null);
    };

    return (
        <ModalContext.Provider value={createModal}>
            {children}

            {message && (
                <div className='confirm-overlay flex flex-column'>
                    <div className='confirm-modal flex flex-column'>
                        <h3>{title}</h3>
                        <p dangerouslySetInnerHTML={{ __html: `${message}` }}></p>

                        <div className='confirm-modal__action flex flex-align-center flex-justify-end gap-2'>
                            {buttons?.map((button) => (
                                <button
                                    class={`btn btn-${button.type}`}
                                    onClick={button.action === "resolve" ? handleResolve : handleReject}>
                                    {button.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </ModalContext.Provider>
    );
}

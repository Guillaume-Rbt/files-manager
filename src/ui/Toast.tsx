import { useCallback, useContext, useState } from "preact/hooks";
import { createContext, ComponentChildren } from "preact";
import CloseIcon from "../assets/icons/close.svg?react";
type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
    id: string;
    title: string;
    message: string;
    type: ToastType;
    duration: number;
    actions?: {
        type: "primary" | "secondary";
        label: string;
        onClick: () => void;
    }[];
};

type ToastContextType = {
    addToast: (
        {
            title,
            message,
            type,
            actions,
        }: {
            title: string;
            message: string;
            type?: ToastType;
            actions?: {
                type: "primary" | "secondary";
                label: string;
                onClick: () => void;
            }[];
        },
        duration?: number,
    ) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ComponentChildren }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback(
        (
            {
                title,
                message,
                type = "info",
                actions,
            }: {
                title: string;
                message: string;
                type?: ToastType;
                actions?: {
                    type: "primary" | "secondary";
                    label: string;
                    onClick: () => void;
                }[];
            },
            duration: number = 3000,
        ) => {
            const id = crypto.randomUUID();
            setToasts((current) => [
                ...current,
                {
                    id,
                    title,
                    message,
                    type,
                    duration,
                    actions,
                },
            ]);

            setTimeout(() => {
                removeToast(id);
            }, duration);
        },
        [removeToast],
    );

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}

            <div className='files-manager__toast-container flex flex-column'>
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const colors = {
        success: "var(--fm-success)",
        error: "var(--fm-danger)",
        warning: "var(--fm-warning)",
        info: "var(--fm-primary)",
    };

    const actionsBtnType = {
        primary: "btn-ve-primary",
        secondary: "btn-outline-primary",
    };

    return (
        <div
            style={{ "--color": colors[toast.type] }}
            className={`
               files-manager__toast

        min-w-[300px]
        text-dark
        bg-ve-white
        rounded-2
        overflow-hidden
      `}>
            <div className='flex flex-column flex-align-start'>
                <div className='flex flex-column files-manager__toast__content w-full'>
                    <div className='flex flex-justify-center flex-align-center files-manager__toast__header'>
                        <p className='files-manager__toast__title'>{toast.title}</p>

                        <button type='button' onClick={onClose} className='ml-auto files-manager__toast__close'>
                            <CloseIcon />
                        </button>
                    </div>
                    <span className='flex-1'>{toast.message}</span>
                    <div className='flex gap-2 justify-end'>
                        {toast.actions?.map((action, index) => (
                            <button
                                key={index}
                                className={`btn ${actionsBtnType[action.type]} text-4 px-2.5 font-400  rounded-2`}
                                onClick={() => {
                                    action.onClick();
                                    onClose();
                                }}>
                                {action.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div
                    style={{
                        animationDuration: `${toast.duration}ms`,
                    }}
                    className='h-1 w-full files-manager__toast__timer '></div>
            </div>
        </div>
    );
}
export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }

    return context;
}

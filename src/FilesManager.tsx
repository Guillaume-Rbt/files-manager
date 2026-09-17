import { useState } from "preact/hooks";
import { Tree } from "./components/Tree";
import { Files } from "./components/Files";
import { ToastProvider } from "./ui/Toast";
import { ModalProvider } from "./ui/Modals";

export function FilesManagerComponent() {
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    return (
        <ModalProvider>
            <ToastProvider>
                <div className='file-manager__overlay'>
                    <div className='files-manager flex'>
                        <Tree />
                        <Files />
                        {toastMessage && (
                            <div className='files-manager__toast' role='alert'>
                                <span>{toastMessage}</span>
                                <button
                                    type='button'
                                    aria-label='Fermer le message'
                                    onClick={() => setToastMessage(null)}>
                                    x
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </ToastProvider>
        </ModalProvider>
    );
}

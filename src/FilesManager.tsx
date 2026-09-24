import { useState } from "preact/hooks";
import { Tree } from "./components/Tree";
import { Files } from "./components/Files";
import { ToastProvider } from "./ui/Toast";
import { ModalProvider } from "./ui/Modals";

export function FilesManagerComponent({ hidden }: { hidden: boolean }) {
    return (
        <ModalProvider>
            <div className='file-manager__overlay'>
                <div className={`files-manager flex ${hidden ? "hidden" : ""}`}>
                    <ToastProvider>
                        <Tree />
                        <Files />
                    </ToastProvider>
                </div>
            </div>
        </ModalProvider>
    );
}

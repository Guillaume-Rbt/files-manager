import { useState, useEffect } from "preact/hooks";
import { Tree } from "./components/Tree";
import { Files } from "./components/Files";
import { ToastProvider } from "./ui/Toast";
import { ModalProvider } from "./ui/Modals";
import { setActiveFolderId } from "./stores/activeFolder";
import { setActiveFileId } from "./stores/activeFile";

export function FilesManagerComponent({ hidden }: { hidden: boolean }) {
    useEffect(() => {
        if (hidden) {
            setActiveFolderId(null);
            setActiveFileId(null);
        }
    }, [hidden]);

    return (
        <ModalProvider>
            <div className='file-manager__overlay'>
                <div className={`files-manager flex relative ${hidden ? "hidden" : ""}`}>
                    <ToastProvider>
                        <Tree />
                        <Files />
                    </ToastProvider>
                </div>
            </div>
        </ModalProvider>
    );
}

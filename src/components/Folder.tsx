import { memo } from "preact/compat";
import { useFolderActive } from "../stores/activeFolder";
import { useState } from "preact/hooks";
import type { FolderNode, FolderType } from "../types";
import { Add } from "../ui/Add";
import { setActiveFolderId } from "../stores/activeFolder";
import { FilesManager } from "../files-manager";
import { useToast } from "../ui/Toast";

function FolderComponent({
    folder,
    onFolderAdded,
    onFolderDeleted,
}: {
    folder: FolderNode;
    onFolderAdded: (folder: FolderType) => void;
    onFolderDeleted: (folderId: string) => void;
}) {
    const { addToast } = useToast();

    const [isExpanded, setIsExpanded] = useState(false);
    const [addFolder, setAddFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const isActive = useFolderActive() === folder.id;

    const handleAddFolder = async () => {
        if (newFolderName.trim() === "") {
            return;
        }

        const folders = folder.children;

        let alreadyExists = false;

        folders.forEach((f) => {
            if (f.name === newFolderName) {
                alreadyExists = true;
                return;
            }
        });

        if (alreadyExists) {
            addToast({
                title:
                    'Un dossier nomme "' + newFolderName + '" existe deja ici.',
                message: "Veuillez choisir un autre nom.",
            });
            return;
        }

        const response = await fetch(`${FilesManager.endPoint}/folders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: newFolderName,
                parent: folder.id,
            }),
        });
        const data = (await response.json()) as
            | FolderType
            | { message?: string };

        if (!response.ok) {
            addToast(
                {
                    title: "Impossible de creer le dossier.",
                    message: "Veuillez réessayer plus tard.",
                },
                10000000,
            );
            return;
        }

        onFolderAdded(data as FolderType);

        setIsExpanded(true);
        setNewFolderName("");
        setAddFolder(false);
    };

    const handleDeleteFolder = async () => {
        const response = await fetch(`${FilesManager.endPoint}/folders`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: folder.id }),
        });

        if (response.ok) {
            setIsExpanded(false);
            onFolderDeleted(folder.id);
        }
    };

    return (
        <div class='files-manager__folder-wrapper flex flex-column flex-align-start'>
            <div className='flex flex-align-start'>
                <button
                    className={`files-manager__folder flex flex-align-center ${isActive ? "files-manager__folder--is-active" : ""}`}
                    onClick={() => {
                        if (!document.startViewTransition) {
                            setIsExpanded(!isExpanded || !isActive);
                        }
                        document.startViewTransition(() => {
                            setIsExpanded(!isExpanded || !isActive);
                        });

                        setActiveFolderId(folder.id);
                    }}>
                    {folder.name}
                </button>
                <Add onClick={() => setAddFolder(!addFolder)} />
                {folder.id !== "/" && (
                    <button onClick={handleDeleteFolder}>Delete</button>
                )}
            </div>

            <div
                class={`files-manager__folder__children ${isExpanded ? "files-manager__folder__children--is-expended" : ""}`}>
                {folder.children.map((child) => (
                    <Folder
                        key={child.id}
                        folder={child}
                        onFolderAdded={onFolderAdded}
                        onFolderDeleted={onFolderDeleted}
                    />
                ))}
            </div>

            {addFolder && (
                <div className='files-manager__add-folder-wrapper'>
                    <input
                        type='text'
                        placeholder='Folder Name'
                        value={newFolderName}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleAddFolder();
                            }
                        }}
                        onChange={(e) =>
                            setNewFolderName(e.currentTarget.value)
                        }
                    />
                    <button onClick={handleAddFolder}>Add</button>
                </div>
            )}
        </div>
    );
}

export const Folder = memo(FolderComponent);

import { memo } from "preact/compat";
import { useFolderActive } from "../stores/activeFolder";
import { useState, useRef, useLayoutEffect } from "preact/hooks";
import type { FolderNode, FolderType } from "../types";
import { setActiveFolderId } from "../stores/activeFolder";
import { FilesManager } from "../files-manager";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../ui/Toast";
import { useFolders } from "../stores/folders";
import FolderOpenIcon from "../assets/icons/folder-open.svg?react";
import FolderIcon from "../assets/icons/folder.svg?react";
import { RoundedButton } from "../ui/RoundedButton";
import AddIcon from "../assets/icons/add.svg?react";
import DeleteIcon from "../assets/icons/delete.svg?react";
import RenameIcon from "../assets/icons/rename.svg?react";
import { useConfirm } from "../hooks/useConfirm";
import { confirmSanitizedName, translation } from "../utils/functions";

type FolderResponse = FolderType | { message?: string };

// Checks whether a folder with `name` already exists under `parent`, excluding `excludeId`.
function hasSiblingWithName(candidates: FolderType[], parent: string | null, name: string, excludeId?: string) {
    return candidates.some(
        (candidate) => candidate.id !== excludeId && candidate.parent === parent && candidate.name === name,
    );
}

function FolderComponent({
    folder,
    onFolderAdded,
    onFolderDeleted,
    onFolderRenamed,
}: {
    folder: FolderNode;
    onFolderAdded: (folder: FolderType) => void;
    onFolderDeleted: (folderId: string) => void;
    onFolderRenamed: (folderId: string, folder: FolderType) => void;
}) {
    const { addToast } = useToast();
    const { folders } = useFolders();
    const { request: createFolder } = useFetch<FolderResponse>(`${FilesManager.endPoint}/folders`, undefined, true);
    const { request: deleteFolder } = useFetch<FolderResponse>(`${FilesManager.endPoint}/folders`, undefined, true);
    const { request: renameFolder } = useFetch<FolderResponse>(`${FilesManager.endPoint}/folders`, undefined, true);

    const [isExpanded, setIsExpanded] = useState(false);
    const [addFolder, setAddFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const [renamedFolderName, setRenamedFolderName] = useState(folder.name);
    const currentInput = useRef<HTMLInputElement>(null);
    const confirm = useConfirm();
    const waitValidation = useRef(true);

    const isActive = useFolderActive() === folder.id;

    useLayoutEffect(() => {
        if (currentInput.current) {
            currentInput.current.focus();
        }
    }, [addFolder, isRenaming]);

    const handleAddFolder = async () => {
        if (!waitValidation.current) {
            return;
        }
        waitValidation.current = false;
        if (newFolderName.trim() === "") {
            setAddFolder(false);
            return;
        }
        const effectiveName = await confirmSanitizedName(newFolderName, confirm, translation("folderSubject"));
        if (effectiveName === null) {
            currentInput.current?.focus();
            return;
        }

        const alreadyExists = hasSiblingWithName(folders, folder.id, effectiveName);

        if (alreadyExists) {
            addToast({
                title: translation("duplicateFolderTitle", { name: effectiveName }),
                message: translation("chooseAnotherName"),
            });
            return;
        }

        const { data, ok } = await createFolder({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: effectiveName, parent: folder.id }),
        });

        if (!ok || !data) {
            addToast({
                title: translation("createFolderErrorTitle"),
                message: translation("retryLater"),
            });
            return;
        }

        onFolderAdded(data as FolderType);

        setIsExpanded(true);
        setNewFolderName("");
        setAddFolder(false);
    };

    const handleDeleteFolder = async () => {
        const confirmed = await confirm({
            title: translation("deleteFolderTitle"),
            message: translation("deleteFolderMessage", { name: folder.name }),
            confirmText: translation("delete"),
        });

        if (!confirmed) {
            return;
        }

        const { ok } = await deleteFolder({
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: folder.id }),
        });

        if (ok) {
            setIsExpanded(false);
            onFolderDeleted(folder.id);
        }
    };

    const handleRenameFolder = async () => {
        if (!waitValidation.current) {
            return;
        }
        waitValidation.current = false;

        const name = await confirmSanitizedName(renamedFolderName, confirm, translation("folderSubject"));

        if (name === folder.name) {
            setIsRenaming(false);
            return;
        }

        if (name === null) {
            setIsRenaming(true);
            currentInput.current?.focus();
            return;
        }

        if (name !== folder.name && hasSiblingWithName(folders, folder.parent, name, folder.id)) {
            addToast({
                title: translation("duplicateFolderTitle", { name }),
                message: translation("chooseAnotherName"),
                type: "warning",
            });
            return;
        }

        const { data, ok } = await renameFolder({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: folder.id, name }),
        });

        if (!ok || !data) {
            addToast({
                title: translation("renameFolderErrorTitle"),
                message: data && "message" in data && data.message ? data.message : translation("retryLater"),
                type: "error",
            });
            return;
        }

        onFolderRenamed(folder.id, data as FolderType);
        if (isActive) {
            setActiveFolderId((data as FolderType).id);
        }

        setIsRenaming(false);
        addToast({
            title: translation("folderRenamedTitle"),
            message: translation("folderRenamedMessage", { name }),
            type: "success",
        });
    };

    return (
        <div className='files-manager__folder-wrapper flex flex-column flex-align-start'>
            <div
                role='button'
                aria-label={translation("folderLabel", { name: folder.name })}
                aria-expanded={isExpanded}
                aria-current={isActive ? "page" : undefined}
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) {
                        return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setIsExpanded(!isExpanded || !isActive);
                        setActiveFolderId(folder.id);
                    }
                }}
                onClick={() => {
                    if (!document.startViewTransition) {
                        setIsExpanded(!isExpanded || !isActive);
                    } else {
                        document.startViewTransition(() => {
                            setIsExpanded(!isExpanded || !isActive);
                        });
                    }

                    setActiveFolderId(folder.id);
                }}
                className={`flex flex-align-center w-full files-manager__folder ${isActive ? "files-manager__folder--is-active" : ""}`}>
                <span className={`flex flex-align-center mr-auto flex-grow files-manager__folder__name`}>
                    {isExpanded ? (
                        <FolderOpenIcon className='files-manager__folder__icon shrink-0' />
                    ) : (
                        <FolderIcon className='files-manager__folder__icon shrink-0' />
                    )}
                    {isRenaming ? (
                        <input
                            ref={currentInput}
                            onBlur={() => {
                                handleRenameFolder();
                            }}
                            className={"flex-grow files-manager__folder__input"}
                            type='text'
                            aria-label={translation("renameFolderLabel", { name: folder.name })}
                            value={renamedFolderName}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => {
                                waitValidation.current = true;
                                setRenamedFolderName(event.currentTarget.value);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    void handleRenameFolder();
                                }
                                if (event.key === "Escape") {
                                    setIsRenaming(false);
                                    setRenamedFolderName(folder.name);
                                }
                            }}
                        />
                    ) : (
                        folder.name
                    )}
                </span>
                <div className='flex flex-align-center files-manager__folder__actions'>
                    <RoundedButton
                        aria-label={translation("addFolderLabel", { name: folder.name })}
                        onClick={(e) => {
                            e.stopPropagation();
                            setAddFolder(!addFolder);
                        }}>
                        <AddIcon />
                    </RoundedButton>
                    {folder.id !== "/" && (
                        <>
                            {!isRenaming ? (
                                <RoundedButton
                                    aria-label={translation("renameFolderLabel", { name: folder.name })}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRenamedFolderName(folder.name);
                                        setIsRenaming(true);
                                    }}>
                                    <RenameIcon />
                                </RoundedButton>
                            ) : null}
                            <RoundedButton
                                type='danger'
                                aria-label={translation("deleteFolderLabel", { name: folder.name })}
                                onClick={handleDeleteFolder}>
                                <DeleteIcon />
                            </RoundedButton>
                        </>
                    )}
                </div>
            </div>

            <div
                class={`files-manager__folder__children ${isExpanded ? "files-manager__folder__children--is-expended" : ""}`}>
                {folder.children.map((child) => (
                    <Folder
                        key={child.id}
                        folder={child}
                        onFolderAdded={onFolderAdded}
                        onFolderDeleted={onFolderDeleted}
                        onFolderRenamed={onFolderRenamed}
                    />
                ))}
            </div>

            {addFolder && (
                <div className='flex flex-align-center files-manager__add-folder-wrapper'>
                    <input
                        ref={currentInput}
                        onBlur={(e) => {
                            handleAddFolder();
                        }}
                        className={"files-manager__folder__input flex-grow"}
                        type='text'
                        aria-label={translation("newFolderNameLabel", { name: folder.name })}
                        placeholder={translation("folderNamePlaceholder")}
                        value={newFolderName}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleAddFolder();
                            }
                        }}
                        onChange={(e) => {
                            waitValidation.current = true;
                            setNewFolderName(e.currentTarget.value);
                        }}
                    />
                    <RoundedButton
                        aria-label={translation("confirmAddFolderLabel", { name: folder.name })}
                        onClick={handleAddFolder}>
                        <AddIcon />
                    </RoundedButton>
                </div>
            )}
        </div>
    );
}

export const Folder = memo(FolderComponent);

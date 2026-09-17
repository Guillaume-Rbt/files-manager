import { useMemo, useState } from "preact/hooks";
import { FilesManager } from "../files-manager";
import { useFetch } from "../hooks/useFetch";
import { useToast } from "../ui/Toast";
import type { FileType, FolderNode } from "../types";
import { useFolders } from "../stores/folders";
import { buildFolderTree } from "../utils/functions";
import FolderOpenIcon from "../assets/icons/folder-open.svg?react";
import FolderIcon from "../assets/icons/folder.svg?react";
import CloseIcon from "../assets/icons/close.svg?react";

function FolderOption({
    folder,
    selectedId,
    onSelect,
}: {
    folder: FolderNode;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <li>
            <button
                type='button'
                className={`files-manager__move-folder ${selectedId === folder.id ? "files-manager__folder--is-active" : ""}`}
                aria-pressed={selectedId === folder.id}
                onClick={() => onSelect(folder.id)}>
                {folder.id === "/" ? (
                    <FolderOpenIcon className='files-manager__move-folder__icon' />
                ) : (
                    <FolderIcon className='files-manager__move-folder__icon' />
                )}
                {folder.name}
            </button>
            {folder.children.length > 0 && (
                <ul className='files-manager__move-folder-children'>
                    {folder.children.map((child) => (
                        <FolderOption key={child.id} folder={child} selectedId={selectedId} onSelect={onSelect} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export function FilesToolbar({
    activeFile,
    currentFolderId,
    searchTerm,
    onSearchChange,
    onRename,
    onDelete,
    onMoved,
}: {
    activeFile: FileType | undefined;
    currentFolderId: string | null;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onRename: () => void;
    onDelete: (id: string) => void;
    onMoved: (file: FileType, previousFolderId: string | null) => void;
}) {
    const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
    const [destinationId, setDestinationId] = useState<string | null>(null);
    const { addToast } = useToast();
    const { folders, loading: foldersLoading } = useFolders();
    const { request: moveFile } = useFetch<FileType>(`${FilesManager.endPoint}/files/move`, undefined, true);

    const folderTree = useMemo(() => buildFolderTree(folders ?? []), [folders]);
    const canMove = activeFile !== undefined && destinationId !== null && destinationId !== (currentFolderId ?? "/");

    const openMoveMenu = () => {
        setDestinationId(null);
        setIsMoveMenuOpen(true);
    };

    const handleMove = async () => {
        if (!activeFile || !canMove) {
            return;
        }

        const destinationFolderId = destinationId === "/" ? null : destinationId;
        const { data, ok } = await moveFile({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: activeFile.id,
                parent: destinationFolderId,
            }),
        });

        if (!ok || !data) {
            addToast({
                title: "Impossible de déplacer le fichier.",
                message: "Le dossier est peut-être déjà utilisé ou inaccessible.",
                type: "error",
            });
            return;
        }

        onMoved(data, currentFolderId);
        setIsMoveMenuOpen(false);
        setDestinationId(null);
    };

    return (
        <div className='files-manager__toolbar flex flex-align-center'>
            <div className='files-manager__toolbar__actions flex flex-align-center w-full'>
                <button type='button' className={"btn btn-secondary"} disabled={!activeFile} onClick={onRename}>
                    Renommer
                </button>

                <button
                    type='button'
                    className={"btn btn-secondary"}
                    disabled={!activeFile}
                    onClick={() => onDelete(activeFile?.id ?? "")}>
                    Supprimer
                </button>

                <div className='relative'>
                    <button
                        className={`btn btn-secondary ${isMoveMenuOpen ? "active" : ""}`}
                        type='button'
                        disabled={!activeFile}
                        onClick={openMoveMenu}>
                        Déplacer
                    </button>
                    {isMoveMenuOpen && activeFile && (
                        <div className='files-manager__move-menu absolute'>
                            <div className='files-manager__move-menu__header'>
                                <strong>Déplacer « {activeFile.name} »</strong>
                                <button
                                    type='button'
                                    aria-label='Fermer le menu de déplacement'
                                    onClick={() => setIsMoveMenuOpen(false)}>
                                    <CloseIcon />
                                </button>
                            </div>
                            {foldersLoading ? (
                                <p>Chargement des dossiers...</p>
                            ) : (
                                <ul className='files-manager__move-tree'>
                                    {folderTree.map((folder) => (
                                        <FolderOption
                                            key={folder.id}
                                            folder={folder}
                                            selectedId={destinationId}
                                            onSelect={setDestinationId}
                                        />
                                    ))}
                                </ul>
                            )}
                            <button
                                type='button'
                                className='files-manager__move-confirm'
                                disabled={!canMove}
                                onClick={handleMove}>
                                Confirmer le déplacement
                            </button>
                        </div>
                    )}
                </div>

                <label className='ml-auto files-manager__toolbar__search'>
                    <input
                        type='search'
                        value={searchTerm}
                        onInput={(event) => onSearchChange(event.currentTarget.value)}
                        placeholder='Rechercher un fichier'
                    />
                </label>
            </div>
        </div>
    );
}

import { cloneElement } from "preact";
import { FilesManager } from "../files-manager";
import { useFetch } from "../hooks/useFetch";
import type { FileType } from "../types";
import { useState, useLayoutEffect, useRef, useEffect } from "preact/hooks";
import { setActiveFileId, useFileActive } from "../stores/activeFile";
import { confirmSanitizedName } from "../utils/functions";
import { useConfirm } from "../hooks/useConfirm";
import DeleteIcon from "../assets/icons/delete.svg?react";
import AudioFileIcon from "../assets/icons/audio-file.svg?react";
import VideoFileIcon from "../assets/icons/video-file.svg?react";
import ArchiveIcon from "../assets/icons/archive.svg?react";
import DocumentIcon from "../assets/icons/file-icon.svg?react";

export function File({
    file,
    onDeleted,
    onRenamed,
    shouldRename,
    onRenameStarted,
}: {
    file: FileType;
    onDeleted: (id: string) => void;
    onRenamed: (previousFileId: string, file: FileType) => void;
    shouldRename?: boolean;
    onRenameStarted?: () => void;
}) {
    const name = file.name.split("/").pop();
    const { request: renameFile } = useFetch<FileType>(`${FilesManager.endPoint}/files`, undefined, true);
    const [renameMode, setRenameMode] = useState(false);
    const [newName, setNewName] = useState(name ?? "");
    const renameInputElement = useRef<HTMLInputElement>(null);
    const isActive = useFileActive() === file.id;
    const confirm = useConfirm();

    useLayoutEffect(() => {
        if (renameInputElement.current) {
            renameInputElement.current.focus();
        }
    }, [renameMode]);

    useEffect(() => {
        if (shouldRename) {
            setRenameMode(true);
            onRenameStarted?.();
        }
    }, [shouldRename, onRenameStarted]);

    const handleRename = async () => {
        const sanitizedName = await confirmSanitizedName(newName, confirm, "fichier");
        if (sanitizedName === null) {
            renameInputElement.current?.focus();
            return;
        }

        if (!sanitizedName || sanitizedName === name) {
            setNewName(name!);
            setRenameMode(false);
            return;
        }

        const extension = name?.split(".").pop();
        const finalName = sanitizedName.endsWith(`.${extension}`) ? sanitizedName : `${sanitizedName}.${extension}`;

        const { data, ok } = await renameFile({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: file.id,
                name: finalName,
            }),
        });

        if (!ok || !data) {
            setNewName(name ?? "");
            return;
        }

        onRenamed(file.id, data);
        setRenameMode(false);
    };

    return (
        <div
            onClick={() => {
                setActiveFileId(file.id);
            }}
            className={`file flex flex-column flex-items-center ${isActive ? "file--active" : ""}`}>
            <FileIcon file={file} />
            {renameMode ? (
                <input
                    ref={renameInputElement}
                    className='file__name'
                    aria-label={`Renommer le fichier ${name}`}
                    value={newName}
                    onInput={(event) => setNewName(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleRename();
                        }
                        if (event.key === "Escape") {
                            setNewName(name ?? "");
                            setRenameMode(false);
                        }
                    }}
                    onBlur={handleRename}
                />
            ) : (
                <span
                    onDblClick={() => window.open(`${FilesManager.rootDir}/${file.id}`, "_blank")}
                    onClick={() => {
                        setRenameMode(true);
                    }}
                    className='file__name'>
                    {name}
                </span>
            )}
            <button
                type='button'
                className='file__delete'
                aria-label={`Supprimer le fichier ${name}`}
                onClick={() => {
                    onDeleted(file.id);
                }}>
                <DeleteIcon />
            </button>
        </div>
    );
}

function FileIcon({ file }: { file: FileType }) {
    function getFileIcon(mimeType: string | undefined) {
        const tests = {
            image: /^image\//,
            video: /^video\//,
            audio: /^audio\//,
            pdf: /^application\/pdf$/,
            text: /^text\//,
            archive: /^application\/(zip|x-7z-compressed|x-rar-compressed)$/,
        } as Record<string, RegExp>;

        for (const key in tests) {
            if (tests[key].test(mimeType ?? "")) {
                return key;
            }
        }

        return "file";
    }

    const renderIcon = function () {
        const icon = getFileIcon(file.type);
        switch (icon) {
            case "image":
                return <img src={`${FilesManager.rootDir}/${file.id}`} alt={file.name} />;
            case "video":
                return <VideoFileIcon />;
            case "audio":
                return <AudioFileIcon />;
            case "pdf":
                return <DocumentIcon />;
            case "text":
                return <DocumentIcon />;
            case "archive":
                return <ArchiveIcon />;
            default:
                return <DocumentIcon />;
        }
    };

    return cloneElement(renderIcon(), { className: "file-icon" });
}

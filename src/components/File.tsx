import { cloneElement } from "preact";
import { FilesManager } from "../files-manager";
import { useFetch } from "../hooks/useFetch";
import type { FileType } from "../types";
import { useState, useLayoutEffect, useRef, useEffect } from "preact/hooks";
import { setActiveFileId, useFileActive } from "../stores/activeFile";
import { confirmSanitizedName, translation } from "../utils/functions";
import { useConfirm } from "../hooks/useConfirm";
import { useToast } from "../ui/Toast";
import { useFiles } from "../stores/files";
import DeleteIcon from "../assets/icons/delete.svg?react";
import AudioFileIcon from "../assets/icons/audio-file.svg?react";
import VideoFileIcon from "../assets/icons/video-file.svg?react";
import ArchiveIcon from "../assets/icons/archive.svg?react";
import DocumentIcon from "../assets/icons/file-icon.svg?react";
import DefaultFileIcon from "../assets/icons/default-file.svg?react";

type FileResponse = FileType | { message?: string };

// Checks whether a file named `name` already exists among `candidates`, excluding `excludeId`.
function hasSiblingFileWithName(candidates: FileType[], excludeId: string, name: string) {
    return candidates.some((candidate) => candidate.id !== excludeId && candidate.name === name);
}

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
    const { request: renameFile } = useFetch<FileResponse>(`${FilesManager.endPoint}/files`, undefined, true);
    const [renameMode, setRenameMode] = useState(false);
    const [newName, setNewName] = useState(name ?? "");
    const renameInputElement = useRef<HTMLInputElement>(null);
    const isActive = useFileActive() === file.id;
    const confirm = useConfirm();
    const { addToast } = useToast();
    const { files: siblingFiles } = useFiles(file.parent);
    const waitValidation = useRef(true);

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
        if (!waitValidation.current) {
            return;
        }
        waitValidation.current = false;

        const sanitizedName = await confirmSanitizedName(newName, confirm, translation("fileSubject"));

        if (sanitizedName === name) {
            setRenameMode(false);
            return;
        }
        if (sanitizedName === null) {
            setRenameMode(true);
            renameInputElement.current?.focus();
            return;
        }

        const extension = name?.split(".").pop();
        const finalName = sanitizedName.endsWith(`.${extension}`) ? sanitizedName : `${sanitizedName}.${extension}`;

        if (finalName !== name && hasSiblingFileWithName(siblingFiles, file.id, finalName)) {
            addToast({
                title: translation("duplicateFileTitle", { name: finalName }),
                message: translation("chooseAnotherName"),
                type: "warning",
            });
            setRenameMode(true);
            renameInputElement.current?.focus();
            return;
        }

        const { data, ok } = await renameFile({
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: file.id,
                name: finalName,
            }),
        });

        if (!ok || !data) {
            addToast({
                title: translation("renameFileErrorTitle"),
                message: data && "message" in data && data.message ? data.message : translation("retryLater"),
                type: "error",
            });
            setNewName(name ?? "");
            return;
        }

        onRenamed(file.id, data as FileType);
        setRenameMode(false);
        addToast({
            title: translation("fileRenamedTitle"),
            message: translation("fileRenamedMessage", { name: finalName }),
            type: "success",
        });
    };

    return (
        <div
            role='button'
            aria-label={translation("fileLabel", { name: name ?? "" })}
            aria-pressed={isActive}
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.target !== event.currentTarget) {
                    return;
                }

                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveFileId(file.id);
                }
            }}
            onDblClick={() => FilesManager.resolve(`${FilesManager.rootDir}/${file.id}`)}
            onClick={() => {
                setActiveFileId(file.id);
            }}
            className={`file flex flex-column flex-items-center ${isActive ? "file--active" : ""}`}>
            <FileIcon file={file} />
            {renameMode ? (
                <input
                    ref={renameInputElement}
                    className='file__name'
                    aria-label={translation("renameFileLabel", { name: name ?? "" })}
                    value={newName}
                    onInput={(event) => {
                        waitValidation.current = true;
                        setNewName(event.currentTarget.value);
                    }}
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
                    role='button'
                    tabIndex={0}
                    aria-label={translation("renameFileLabel", { name: name ?? "" })}
                    onDblClick={() => window.open(`${FilesManager.rootDir}/${file.id}`, "_blank")}
                    onClick={() => {
                        setRenameMode(true);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setRenameMode(true);
                        }
                    }}
                    className='file__name'>
                    {name}
                </span>
            )}
            <button
                type='button'
                className='file__delete'
                aria-label={translation("deleteFileLabel", { name: name ?? "" })}
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
                return <DefaultFileIcon />;
        }
    };

    return cloneElement(renderIcon(), { className: "file-icon" });
}

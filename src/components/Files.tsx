import { useState, useEffect } from "preact/hooks";
import { useToast } from "../ui/Toast";
import { FilesManager } from "../files-manager";
import { useFolderActive } from "../stores/activeFolder";
import { useFetch } from "../hooks/useFetch";
import type { FileType } from "../types";
import { File } from "./File";
import { addFilesToCache, removeFileFromCache, renameFileInCache, useFiles } from "../stores/files";
import { FilesUploading } from "./FilesUploading";
import { FilesToolbar } from "./FilesToolbar";
import { setActiveFileId, useFileActive } from "../stores/activeFile";
import { sanitizeName, translation } from "../utils/functions";
import { useAlert } from "../hooks/useAlert";
import { useConfirm } from "../hooks/useConfirm";
import { Footer } from "./Footer";

export function Files() {
    const activeFolderId = useFolderActive();
    const activeFileId = useFileActive();
    const { files, loading, ok } = useFiles(activeFolderId);
    const { request: uploadFiles } = useFetch<{ files: FileType[] }>(`${FilesManager.endPoint}/files`, undefined, true);
    const { addToast } = useToast();
    const { request: deleteFile } = useFetch<{ file: string }>(`${FilesManager.endPoint}/files`, undefined, true);
    const [uploadingFileNames, setUploadingFileNames] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [renameFileId, setRenameFileId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const alert = useAlert();
    const confirm = useConfirm();
    const activeFile = files.find((file) => file.id === activeFileId);
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
    const visibleFiles = normalizedSearchTerm
        ? files.filter((file) => file.name.toLocaleLowerCase().split(".")[0].includes(normalizedSearchTerm))
        : files;

    useEffect(() => {
        setActiveFileId(null);
    }, [activeFolderId]);

    const handleFilesAdded = (newFiles: FileType[]) => {
        addFilesToCache(activeFolderId, newFiles);
    };

    const handleFileRenamed = (previousFileId: string, renamedFile: FileType) => {
        renameFileInCache(activeFolderId, previousFileId, renamedFile);
    };

    const handleFileMoved = (movedFile: FileType, previousFolderId: string | null) => {
        removeFileFromCache(previousFolderId, activeFileId ?? movedFile.id);
        addFilesToCache(movedFile.parent, [movedFile]);
        setActiveFileId(null);
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: translation("deleteFileTitle"),
            message: translation("deleteFileMessage", { name: files.find((f) => f.id === id)?.name ?? "" }),
            confirmText: translation("delete"),
            cancelText: translation("cancel"),
        });
        if (!confirmed) {
            return;
        }

        const { ok } = await deleteFile({
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id }),
        });

        if (!ok) {
            return;
        }

        removeFileFromCache(activeFolderId, id);
    };

    const handleDrop = async (event: DragEvent) => {
        event.preventDefault();
        if (!event.dataTransfer?.files?.length) {
            return;
        }

        const droppedFiles = Array.from(event.dataTransfer.files);
        const formData = new FormData();
        formData.append("parent", activeFolderId ?? "");

        const sanitizedFileNames: string[] = [];
        const renamedFileNames: { original: string; sanitized: string }[] = [];

        for (const file of droppedFiles) {
            const sanitized = sanitizeName(file.name);
            sanitizedFileNames.push(sanitized);
            formData.append("files[]", file, sanitized);
            if (sanitized !== file.name) {
                renamedFileNames.push({ original: file.name, sanitized });
            }
        }

        if (renamedFileNames.length > 0) {
            await alert({
                title: translation("correctedFileNamesTitle"),
                message: renamedFileNames
                    .map(({ original, sanitized }) => translation("correctedFileName", { original, sanitized }))
                    .join("<br>"),
            });
        }

        setUploadingFileNames((current) => [...current, ...sanitizedFileNames]);

        try {
            const { data, ok } = await uploadFiles({
                method: "POST",
                body: formData,
            });

            if (!ok || !data) {
                addToast({
                    title: translation("addFileErrorTitle"),
                    message: translation("retryLater"),
                });
                return;
            }

            if ("files" in data) {
                handleFilesAdded(data.files);
            }
        } finally {
            setUploadingFileNames((current) => current.filter((name) => !sanitizedFileNames.includes(name)));
        }
    };

    return (
        <div className={`files-manager__files h-full flex flex-column`}>
            <FilesToolbar
                activeFile={activeFile}
                currentFolderId={activeFolderId}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onDelete={handleDelete}
                onRename={() => setRenameFileId(activeFile?.id ?? null)}
                onMoved={handleFileMoved}
            />
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                }}
                onDrop={(e) => {
                    handleDrop(e);
                    setIsDragging(false);
                }}
                className={`files-manager__files__files-wrapper w-full flex-grow ${isDragging ? "files-manager__files__files-wrapper--is-dragging" : ""}`}>
                {loading && <div>{translation("loading")}</div>}
                {!ok && (
                    <div>
                        {translation("error")}: {translation("loadFilesError")}
                    </div>
                )}
                {visibleFiles.map((file) => (
                    <File
                        key={file.id}
                        file={file}
                        onDeleted={handleDelete}
                        onRenamed={handleFileRenamed}
                        shouldRename={renameFileId === file.id}
                        onRenameStarted={() => setRenameFileId(null)}
                    />
                ))}
            </div>
            <Footer></Footer>
            {uploadingFileNames.length > 0 && <FilesUploading uploadingFileNames={uploadingFileNames} />}
        </div>
    );
}

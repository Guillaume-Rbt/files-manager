import { useToast } from "../ui/Toast";
import { FilesManager } from "../files-manager";
import { useFolderActive } from "../stores/activeFolder";
import { useFetch } from "../hooks/useFetch";
import type { FileType } from "../types";
import { File } from "./File";
import {
    addFilesToCache,
    removeFileFromCache,
    useFiles,
} from "../stores/files";

export function Files() {
    const activeFolderId = useFolderActive();

    const { files, loading, ok } = useFiles(activeFolderId);
    const { request: uploadFiles } = useFetch<{ files: FileType[] }>(
        `${FilesManager.endPoint}/files`,
        undefined,
        true,
    );
    const { addToast } = useToast();

    const handleFilesAdded = (newFiles: FileType[]) => {
        addFilesToCache(activeFolderId, newFiles);
    };

    const handleFileDeleted = (fileId: string) => {
        removeFileFromCache(activeFolderId, fileId);
    };

    const handleDrop = async (event: DragEvent) => {
        event.preventDefault();
        if (!event.dataTransfer?.files?.length) {
            return;
        }

        const formData = new FormData();
        formData.append("parent", activeFolderId ?? "");

        for (const file of event.dataTransfer.files) {
            formData.append("files", file);
        }

        const { data, ok } = await uploadFiles({
            method: "POST",
            body: formData,
        });

        if (!ok || !data) {
            addToast({
                title: "Impossible d'ajouter le fichier.",
                message: "Veuillez réessayer plus tard.",
            });
            return;
        }

        if ("files" in data) {
            handleFilesAdded(data.files);
        }
    };

    return (
        <div className={`files-manager__files h-full`}>
            <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className='files-manager__files__files-wrapper h-full w-full'>
                {loading && <div>Loading...</div>}
                {!ok && <div>Error: Impossible de charger les fichiers.</div>}
                {files.map((file) => (
                    <File
                        key={file.id}
                        file={file}
                        onDeleted={handleFileDeleted}
                    />
                ))}
            </div>
        </div>
    );
}

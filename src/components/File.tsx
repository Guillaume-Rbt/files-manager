import { cloneElement } from "preact";
import { FilesManager } from "../files-manager";
import { useFetch } from "../hooks/useFetch";
import { FileType } from "../types";

export function File({
    file,
    onDeleted,
}: {
    file: FileType;
    onDeleted: (id: string) => void;
}) {
    const name = file.name.split("/").pop();
    const extension = name!.split(".").pop();
    const { request: deleteFile } = useFetch<{ file: string }>(
        `${FilesManager.endPoint}/files`,
        undefined,
        true,
    );

    const handleDelete = async () => {
        const { ok } = await deleteFile({
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: file.id }),
        });

        if (!ok) {
            return;
        }

        onDeleted(file.id);
    };

    return (
        <div className='file flex flex-column flex-items-center'>
            <FileIcon file={file} />
            <span className='file__name'>{name}</span>
            <button
                type='button'
                className='file__delete'
                onClick={handleDelete}>
                Delete
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
                return (
                    <img
                        src={`${FilesManager.rootDir}/${file.name}`}
                        alt={file.name}
                    />
                );
            case "video":
                return <span>🎥</span>;
            case "audio":
                return <span>🎵</span>;
            case "pdf":
                return <span>📄</span>;
            case "text":
                return <span>📝</span>;
            case "archive":
                return <span>🗄️</span>;
            default:
                return <span>📄</span>;
        }
    };

    return cloneElement(renderIcon(), { className: "file-icon" });
}

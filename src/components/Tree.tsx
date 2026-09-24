import { useMemo } from "preact/hooks";
import type { FolderType } from "../types";
import { Folder } from "./Folder";
import { addFolderToCache, removeFolderFromCache, renameFolderInCache, useFolders } from "../stores/folders";
import { buildFolderTree, translation } from "../utils/functions";

export function Tree() {
    const { folders, loading, error } = useFolders();

    const tree = useMemo(() => buildFolderTree(folders), [folders]);

    const handleFolderAdded = (newFolder: FolderType) => {
        // The root virtual folder has id "/"; a null parent means it belongs there.
        addFolderToCache(newFolder);
    };

    const handleFolderDeleted = (folderId: string) => {
        removeFolderFromCache(folderId);
    };

    const handleFolderRenamed = (folderId: string, renamedFolder: FolderType) => {
        renameFolderInCache(folderId, renamedFolder);
    };

    if (loading) {
        return <div>{translation("loading")}</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div class='files-manager__tree flex flex-column h-full'>
            {tree.map((folder) => (
                <Folder
                    key={folder.id}
                    folder={folder}
                    onFolderAdded={handleFolderAdded}
                    onFolderDeleted={handleFolderDeleted}
                    onFolderRenamed={handleFolderRenamed}
                />
            ))}
        </div>
    );
}

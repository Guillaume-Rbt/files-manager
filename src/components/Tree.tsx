import { useEffect, useMemo, useState } from "preact/hooks";
import { useFetch } from "../hooks/useFetch";
import { FilesManager } from "../files-manager";
import type { FolderType, FolderNode } from "../types";
import { Folder } from "./Folder";

function buildTree(folders: FolderType[]): FolderNode[] {
    const map = new Map<string, FolderNode>();

    for (const folder of folders) {
        map.set(folder.id, {
            ...folder,
            children: [],
        });
    }

    const rootChildren: FolderNode[] = [];

    for (const folder of map.values()) {
        if (folder.parent === null) {
            rootChildren.push(folder);
        } else {
            map.get(folder.parent)?.children.push(folder);
        }
    }

    return [{ id: "/", parent: null, children: rootChildren, name: "root" }];
}

// Only clones nodes on the path to the target parent, so sibling subtrees keep
// their reference and memoized Folder components don't re-render.
function addFolderToTree(
    nodes: FolderNode[],
    newFolder: FolderType,
): FolderNode[] {
    let changed = false;

    const nextNodes = nodes.map((node) => {
        if (node.id === newFolder.parent) {
            changed = true;
            return {
                ...node,
                children: [...node.children, { ...newFolder, children: [] }],
            };
        }

        const nextChildren = addFolderToTree(node.children, newFolder);

        if (nextChildren === node.children) {
            return node;
        }

        changed = true;
        return { ...node, children: nextChildren };
    });

    return changed ? nextNodes : nodes;
}

function removeFolderFromTree(
    nodes: FolderNode[],
    folderId: string,
): FolderNode[] {
    let changed = false;

    const nextNodes: FolderNode[] = [];

    for (const node of nodes) {
        if (node.id === folderId) {
            changed = true;
            continue;
        }

        const nextChildren = removeFolderFromTree(node.children, folderId);

        if (nextChildren !== node.children) {
            changed = true;
            nextNodes.push({ ...node, children: nextChildren });
        } else {
            nextNodes.push(node);
        }
    }

    return changed ? nextNodes : nodes;
}

export function Tree() {
    const { data, loading, error } = useFetch<FolderType[]>(
        `${FilesManager.endPoint}/folders`,
    );

    const initialTree = useMemo(() => buildTree(data ?? []), [data]);
    const [tree, setTree] = useState<FolderNode[]>(initialTree);

    useEffect(() => {
        setTree(initialTree);
    }, [initialTree]);

    const handleFolderAdded = (newFolder: FolderType) => {
        setTree((current) => {
            if (newFolder.parent === null) {
                return [...current, { ...newFolder, children: [] }];
            }

            return addFolderToTree(current, newFolder);
        });
    };

    const handleFolderDeleted = (folderId: string) => {
        setTree((current) => removeFolderFromTree(current, folderId));
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    window.sessionStorage.setItem("folders", JSON.stringify(tree));

    return (
        <div class='files-manager__tree flex flex-column h-full'>
            {tree.map((folder) => (
                <Folder
                    key={folder.id}
                    folder={folder}
                    onFolderAdded={handleFolderAdded}
                    onFolderDeleted={handleFolderDeleted}
                />
            ))}
        </div>
    );
}

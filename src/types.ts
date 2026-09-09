export type FolderType = {
    id: string;
    name: string;
    parent: string | null;
};

export type FolderNode = FolderType & {
    children: FolderNode[];
};

export type FileType = {
    id: string;
    name: string;
    parent: string | null;
    extension: string;
    type: string;
};

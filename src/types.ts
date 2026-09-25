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

export type Translation = {
    loading: string;
    error: string;
    fileLabel: string;
    folderLabel: string;
    fileSubject: string;
    folderSubject: string;
    renameFileLabel: string;
    renameFolderLabel: string;
    deleteFileLabel: string;
    deleteFolderLabel: string;
    addFolderLabel: string;
    newFolderNameLabel: string;
    confirmAddFolderLabel: string;
    folderNamePlaceholder: string;
    chooseFileLabel: string;
    chooseFile: string;
    confirm: string;
    cancel: string;
    rename: string;
    move: string;
    delete: string;
    closeMoveMenu: string;
    moveFileLabel: string;
    moveFileTitle: string;
    loadingFolders: string;
    confirmMove: string;
    searchFile: string;
    deleteFileTitle: string;
    deleteFileMessage: string;
    correctedFileNamesTitle: string;
    correctedFileName: string;
    addFileErrorTitle: string;
    moveFileErrorTitle: string;
    moveFileErrorMessage: string;
    loadFilesError: string;
    loadFoldersError: string;
    duplicateFolderTitle: string;
    chooseAnotherName: string;
    createFolderErrorTitle: string;
    deleteFolderTitle: string;
    deleteFolderMessage: string;
    renameFolderErrorTitle: string;
    folderRenamedTitle: string;
    folderRenamedMessage: string;
    duplicateFileTitle: string;
    renameFileErrorTitle: string;
    fileRenamedTitle: string;
    fileRenamedMessage: string;
    duplicateFilesDropTitle: string;
    duplicateFilesDropMessage: string;
    sanitizeNameMessage: string;
    retryLater: string;
    closeMessage: string;
    ok: string;
};

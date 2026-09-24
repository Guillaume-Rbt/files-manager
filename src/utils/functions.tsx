import { FilesManager } from "../files-manager";
import type { FolderNode, FolderType } from "../types";

export function sanitizeName(name: string) {
    const sanitzed = name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}._-]+/gu, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_.]+|[-_.]+$/g, "");

    const date = new Date();
    const fallbackName = `name-${date.toLocaleDateString().replace(/\//g, "-")}`;

    return sanitzed || fallbackName;
}

// Builds a folder tree with a virtual "/" root node from a flat folder list.
export function buildFolderTree(folders: FolderType[]): FolderNode[] {
    const nodes = new Map<string, FolderNode>();

    for (const folder of folders) {
        nodes.set(folder.id, { ...folder, children: [] });
    }

    const rootChildren: FolderNode[] = [];

    for (const folder of nodes.values()) {
        if (folder.parent === null) {
            rootChildren.push(folder);
        } else {
            nodes.get(folder.parent)?.children.push(folder);
        }
    }

    return [{ id: "/", name: "/", parent: null, children: rootChildren }];
}

// Sanitizes a name and, when it differs from the input, asks the user to confirm the
// auto-correction. Returns the resolved name, or null if the user declined the change.
export async function confirmSanitizedName(
    name: string,
    confirm: (options: { message: string }) => Promise<boolean>,
    subject: string,
): Promise<string | null> {
    const sanitized = sanitizeName(name);

    if (name === sanitized) {
        return sanitized;
    }

    const confirmed = await confirm({
        message: translation("sanitizeNameMessage", { subject, name: sanitized }),
    });

    return confirmed ? sanitized : null;
}

export function translation(
    key: keyof typeof FilesManager.lang,
    replacements: Record<string, string | number> = {},
): string {
    const template = FilesManager.lang[key] ?? key;

    return Object.entries(replacements).reduce(
        (translated, [name, value]) => translated.replaceAll(`{{${name}}}`, String(value)),
        template,
    );
}

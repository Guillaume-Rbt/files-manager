import { fastify } from "fastify";
import fs from "node:fs/promises";
import path from "node:path";
import multipart from "@fastify/multipart";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import fastifyStatic from "@fastify/static";
import mime from "mime-types";

const rootFolder = path.resolve(import.meta.dirname, "../public/files");

const app = fastify({
    logger: true,
    // Default is 1 MiB, too small for video/large file uploads.
    bodyLimit: 1024 * 1024 * 1024,
});
app.register(multipart, {
    limits: { fileSize: 1024 * 1024 * 1024 },
});
app.register(fastifyStatic, {
    root: rootFolder,
    prefix: "/public/",
});

// Resolves a relative id to an absolute path, rejecting anything outside rootFolder.
function resolveInRoot(relativePath: string): string {
    const sanitized = relativePath.replace(/^[/\\]+/, "");
    const fullPath = path.resolve(rootFolder, sanitized);

    if (fullPath !== rootFolder && !fullPath.startsWith(rootFolder + path.sep)) {
        throw new Error("Invalid path");
    }

    return fullPath;
}

// Treats an empty string or "/" the same as "no parent" (root folder).
function normalizeId(id: string | null | undefined): string | null {
    return id && id !== "" && id !== "/" ? id : null;
}

function toId(parent: string | null, name: string): string {
    return parent ? path.posix.join(parent, name) : name;
}

async function getDirectories(directory: string): Promise<string[]> {
    const result: string[] = [];

    const entries = await fs.readdir(directory, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        if (!entry.isDirectory()) {
            continue;
        }

        const fullPath = path.join(directory, entry.name);

        result.push(fullPath);

        const children = await getDirectories(fullPath);
        result.push(...children);
    }

    return result;
}

function toFileResponse(name: string, parent: string | null, type: string) {
    return {
        id: toId(parent, name),
        name,
        parent,
        extension: name.split(".").pop() ?? "",
        type,
    };
}

app.get("/api/folders", async () => {
    const directories = await getDirectories(rootFolder);

    return directories.map((dir) => {
        const relativePath = path.relative(rootFolder, dir).replaceAll(path.sep, "/");

        const parentPath = path.posix.dirname(relativePath);

        return {
            id: relativePath,
            name: path.basename(dir),
            parent: parentPath === "." ? null : parentPath,
        };
    });
});

app.post("/api/folders", async (request, response) => {
    const data = await request.body;

    const { name, parent: rawParent } = data as {
        name: string;
        parent: string | null;
    };
    const parent = normalizeId(rawParent);

    try {
        const folderPath = parent ? path.join(resolveInRoot(parent), name) : path.join(rootFolder, name);

        await fs.mkdir(folderPath);
        response.status(201).send({
            name: name,
            parent: parent,
            id: toId(parent, name),
        });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
            response.status(409).send({
                message: `Un dossier nomme "${name}" existe deja ici.`,
            });
            return;
        }

        response.status(500).send({ message: "Error creating folder", error });
    }
});

app.patch("/api/folders", async (request, response) => {
    const data = await request.body;
    const { id, name } = data as { id: string; name: string };

    try {
        const folderPath = resolveInRoot(id);
        const newFolderPath = path.join(path.dirname(folderPath), name);

        await fs.rename(folderPath, newFolderPath);

        const parent = path.posix.dirname(id);
        response.status(200).send({
            id: toId(parent === "." ? null : parent, name),
            name,
            parent: parent === "." ? null : parent,
        });
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            response.status(404).send({ message: "Dossier introuvable." });
            return;
        }

        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
            response.status(409).send({
                message: `Un dossier nomme "${name}" existe deja ici.`,
            });
            return;
        }

        response.status(500).send({ message: "Error renaming folder", error });
    }
});

app.delete("/api/folders", async (request, response) => {
    const data = await request.body;
    const { id } = data as { id: string };

    try {
        const folderPath = resolveInRoot(id);
        await fs.rm(folderPath, { recursive: true, force: true });
        response.status(200).send({ message: "Folder deleted successfully" });
    } catch (error) {
        response.status(500).send({ message: "Error deleting folder", error });
    }
});

app.get("/api/files", async (request, response) => {
    const { parent } = request.query as { parent?: string };
    const parentId = normalizeId(parent);

    try {
        const folderPath = parentId ? resolveInRoot(parentId) : rootFolder;

        const entries = await fs.readdir(folderPath, { withFileTypes: true });
        const files = entries.filter((entry) => {
            return entry.isFile();
        });

        response
            .status(200)
            .send(
                files.map((file) =>
                    toFileResponse(file.name, parentId, mime.lookup(file.name) || "application/octet-stream"),
                ),
            );
    } catch (error) {
        response.status(500).send({ message: "Error reading files", error });
    }
});

app.post("/api/files", async (request, response) => {
    const parts = request.parts();
    let parent: string | null = null;
    const addedFiles: {
        id: string;
        name: string;
        parent: string | null;
        extension: string;
        type: string;
    }[] = [];

    for await (const part of parts) {
        if (part.type === "field" && part.fieldname === "parent") {
            parent = normalizeId(typeof part.value === "string" ? part.value : null);
            continue;
        }

        if (part.type !== "file") {
            continue;
        }

        const folderPath = parent ? resolveInRoot(parent) : rootFolder;
        const filePath = path.join(folderPath, part.filename);

        try {
            await pipeline(part.file, createWriteStream(filePath, { flags: "wx" }));
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "EEXIST") {
                response.status(409).send({
                    message: `Un fichier nomme "${part.filename}" existe deja ici.`,
                });
                return;
            }

            throw error;
        }

        addedFiles.push(toFileResponse(part.filename, parent, part.mimetype));
    }

    response.status(201).send({ files: addedFiles });
});

app.patch("/api/files", async (request, response) => {
    const data = await request.body;
    const { id, name } = data as { id: string; name: string };

    try {
        const filePath = resolveInRoot(id);
        const newFilePath = path.join(path.dirname(filePath), name);

        await fs.rename(filePath, newFilePath);

        const parentDir = path.posix.dirname(id);
        const parent = parentDir === "." ? null : parentDir;

        response.status(200).send(toFileResponse(name, parent, mime.lookup(name) || "application/octet-stream"));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            response.status(404).send({ message: "Fichier introuvable." });
            return;
        }

        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
            response.status(409).send({
                message: `Un fichier nomme "${name}" existe deja ici.`,
            });
            return;
        }

        response.status(500).send({ message: "Error renaming file", error });
    }
});

app.post("/api/files/move", async (request, response) => {
    const data = await request.body;
    const { id, parent: rawParent } = data as {
        id: string;
        parent: string | null;
    };
    const parent = normalizeId(rawParent);
    const name = path.basename(id);

    try {
        const filePath = resolveInRoot(id);
        const destinationFolder = parent ? resolveInRoot(parent) : rootFolder;
        const newFilePath = path.join(destinationFolder, name);

        await fs.rename(filePath, newFilePath);

        response.status(200).send(toFileResponse(name, parent, mime.lookup(name) || "application/octet-stream"));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            response.status(404).send({ message: "Fichier introuvable." });
            return;
        }

        if ((error as NodeJS.ErrnoException).code === "EEXIST") {
            response.status(409).send({
                message: `Un fichier nomme "${name}" existe deja ici.`,
            });
            return;
        }

        response.status(500).send({ message: "Error moving file", error });
    }
});

app.delete("/api/files", async (request, response) => {
    const data = await request.body;
    const { id } = data as { id: string };

    try {
        const filePath = resolveInRoot(id);
        await fs.rm(filePath, { force: true });
        response.status(200).send({ file: id });
    } catch (error) {
        response.status(500).send({ message: "Error deleting file", error });
    }
});

app.listen({ port: 8000 }, (err, address) => {
    if (err) {
        app.log.error(err);
        process.exit(1);
    }

    app.log.info(`Server listening at ${address}`);
});

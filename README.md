# Files Manager

A Preact-based file manager exposed as a web component.

## Installation

Install directly from the repository:

```bash
npm install github:Guillaume-Rbt/files-manager
```

## Usage

Import the styles and register the custom element once during application startup:

```ts
import "files-manager/style.css";
import { FilesManager } from "files-manager";

const filesManager = new FilesManager();
filesManager.defineElement();
```

Add the element to the page. `root-dir` is the public path where uploaded files are served and `endpoint` is the API
base URL.

```html
<files-manager root-dir="/files" endpoint="/api"></files-manager>
```

Open the manager and retrieve the selected file path:

```ts
import type { FilesManagerElement } from "files-manager";

const element = document.querySelector("files-manager") as FilesManagerElement;

const selectedFile = await element.changeVisibility();
```

`FilesManagerOptions`, `FilesManagerElement`, `Translation`, `FileType`, `FolderType` and `FolderNode` are exported for
TypeScript integrations. The default French translation is also available as `fr`.

## Publishing

```bash
npm run build
npm publish
```

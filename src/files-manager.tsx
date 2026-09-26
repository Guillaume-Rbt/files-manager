// @ts-ignore
import "./css/style.css";

import { render } from "preact";
import { FilesManagerComponent } from "./FilesManager";
import { fr as FR } from "./lang/fr";

import type { Translation } from "./types";


export type FilesManagerOptions = {
    lang?: Translation;
};


export interface FilesManagerElement extends HTMLElement {
    open(): Promise<string | null>;
    close(): void;
}


class FilesManager {
    static lang: Translation = FR;
    static endPoint: string = "/api";
    static rootDir: string = "/files";

    static promise: Promise<string | null> | null = null;

    static resolve: ((value: string | null) => void) | null = null;
    static reject: ((reason?: unknown) => void) | null = null;


    constructor(options: FilesManagerOptions = {}) {
        FilesManager.lang = options.lang ?? FR;
    }


    defineElement(name: string = "files-manager") {

        class FilesManagerHTMLElement extends HTMLElement {
            hidden = true;


            connectedCallback() {
                this.classList.add("files-manager");
                this.render();
            }


            static get observedAttributes() {
                return ["root-dir", "endpoint"];
            }


            open(): Promise<string | null> {

         
                if (FilesManager.promise) {
                    return FilesManager.promise;
                }

                this.hidden = false;
                this.render();

                FilesManager.promise = new Promise<string | null>(
                    (resolve, reject) => {
                        FilesManager.resolve = resolve;
                        FilesManager.reject = reject;
                    }
                ).finally(() => {
                    this.hidden = true;

                    FilesManager.promise = null;
                    FilesManager.resolve = null;
                    FilesManager.reject = null;

                    this.render();
                });

                return FilesManager.promise;
            }


            close(): void {
                if (this.hidden) {
                    return;
                }

                this.hidden = true;
                this.render();

        
                FilesManager.resolve?.(null);
            }


            attributeChangedCallback(
                name: string,
                oldValue: string | null,
                newValue: string | null
            ) {
                if (oldValue === newValue) {
                    return;
                }

                switch (name) {
                    case "root-dir":
                        if (newValue !== null) {
                            FilesManager.rootDir = newValue;
                        }
                        break;

                    case "endpoint":
                        if (newValue !== null) {
                            FilesManager.endPoint = newValue;
                        }
                        break;
                }
            }


            render() {
                render(
                    <FilesManagerComponent hidden={this.hidden} />,
                    this
                );
            }
        }


        if (!customElements.get(name)) {
            customElements.define(name, FilesManagerHTMLElement);
        }
    }
}


export { FilesManager };

export { fr } from "./lang/fr";

export type {
    FileType,
    FolderNode,
    FolderType,
    Translation
} from "./types";
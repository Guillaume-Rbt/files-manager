// @ts-ignore
import "./css/style.css";
import { FilesManagerComponent } from "./FilesManager";
import { render } from "preact";
import { fr as FR } from "./lang/fr";
import type { Translation } from "./types";

export class FilesManager {
    static lang: Translation = FR;
    static endPoint: string = "/api";
    static rootDir: string = "/files";
    static promise = null as Promise<string> | null;
    static resolve: (value: string) => void;
    static reject: (reason?: any) => void;

    constructor(options: { lang?: Translation } = {}) {
        FilesManager.lang = options.lang ?? FR;
    }

    defineElement(name: string = "files-manager") {
        class element extends HTMLElement {
            hidden = true;

            connectedCallback() {
                this.classList.add("files-manager");
                this.render();
            }
            static get observedAttributes() {
                return ["root-dir", "endpoint"];
            }

            changeVisibility() {
                this.hidden = !this.hidden;

                this.render();

                if (!this.hidden && !FilesManager.promise) {
                    FilesManager.promise = new Promise<string>((resolve, reject) => {
                        FilesManager.resolve = resolve;
                        FilesManager.reject = reject;
                    }).finally(() => {
                        this.changeVisibility();
                        FilesManager.promise = null;
                    });

                    return FilesManager.promise;
                }

                return null;
            }

            attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
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
                render(<FilesManagerComponent hidden={this.hidden} />, this);
            }
        }

        customElements.define(name, element);
    }
}

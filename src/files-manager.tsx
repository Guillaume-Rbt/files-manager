// @ts-ignore
import "./css/style.css";
import { FilesManagerComponent } from "./FilesManager";
import { render } from "preact";

export class FilesManager {
    static endPoint: string = "/api";
    static rootDir: string = "/files";

    defineElement(name: string = "files-manager") {
        class element extends HTMLElement {
            connectedCallback() {
                this.classList.add("files-manager");
                this.render();
            }
            static get observedAttributes() {
                return ["root-dir", "endpoint"];
            }
            attributeChangedCallback(
                name: string,
                oldValue: string | null,
                newValue: string | null,
            ) {
                if (name === "root-dir" && newValue !== null) {
                    FilesManager.rootDir = newValue;
                } else if (name === "endpoint" && newValue !== null) {
                    FilesManager.endPoint = newValue;
                }
            }

            render() {
                render(<FilesManagerComponent />, this);
            }
        }

        customElements.define(name, element);
    }
}

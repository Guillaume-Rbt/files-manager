import { FilesManager } from "../src/files-manager";
// @ts-ignore
import "./css/style.css";

const fm = new FilesManager();

fm.defineElement("files-manager");

const fmElement = document.querySelector("files-manager") as HTMLElement & {
    changeVisibility: () => Promise<string> | null;
};

const toggleButton = document.querySelector(".toggle");
toggleButton?.addEventListener("click", () => {
    toggleVisibility();
});

const toggleVisibility = async () => {
    const promise = fmElement?.changeVisibility();

    if (promise) {
        const result = await promise;
        alert(result);
    }
};

import { FilesManager } from "../src/files-manager";
// @ts-ignore
import "./css/style.css";

const fm = new FilesManager();

fm.defineElement("files-manager");

const fmElement = document.querySelector("files-manager") as HTMLElement & {
    open: () => Promise<string> | null;
};

const toggleButton = document.querySelector(".toggle");
toggleButton?.addEventListener("click", () => {
    toggleVisibility();
});

const toggleVisibility = async () => {
    const promise = fmElement?.open();

    if (promise) {
        promise.then((result) => alert(result)).catch((error) => console.error(error));
    }
};

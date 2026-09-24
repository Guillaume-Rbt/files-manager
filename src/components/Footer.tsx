import { FilesManager } from "../files-manager";
import { useFileActive } from "../stores/activeFile";
import { translation } from "../utils/functions";

export function Footer() {
    const activeFileId = useFileActive();

    return (
        <footer className='files-manager__footer flex flex-align-center flex-justify-end'>
            <button
                aria-label={translation("chooseFileLabel", { id: activeFileId ?? "" })}
                onClick={() => FilesManager.resolve(`${FilesManager.rootDir}/${activeFileId!}`)}
                type='button'
                disabled={!activeFileId}
                className={"btn btn-primary"}>
                {translation("chooseFile")}
            </button>
            <button
                aria-label={translation("cancel")}
                onClick={() => FilesManager.reject()}
                type='button'
                className='btn btn-secondary'>
                {translation("cancel")}
            </button>
        </footer>
    );
}

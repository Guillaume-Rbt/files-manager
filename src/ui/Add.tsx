export function Add({ onClick }: { onClick: () => void }) {
    return (
        <button className='files-manager__add-folder' onClick={onClick}>
            Add Folder
        </button>
    );
}

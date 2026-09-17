export function FilesUploading({ uploadingFileNames }: { uploadingFileNames: string[] }) {

    return (
        <div className='files-manager__uploads'>
            {uploadingFileNames.map((name, index) => (
                <div key={`${name}-${index}`} className='files-manager__uploads__item'>
                    <span className='files-manager__uploads__item__spinner' />
                    <span className='files-manager__uploads__item__name'>{name}</span>
                </div>
            ))}
        </div>
    );
}

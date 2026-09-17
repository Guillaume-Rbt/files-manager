import type { ComponentChildren, JSX } from "preact";

export function RoundedButton({
    children,
    onClick,
    type = "default",
}: {
    children: ComponentChildren;
    onClick: JSX.MouseEventHandler<HTMLButtonElement>;
    type?: "default" | "danger";
}) {
    return (
        <button data-type={type} onClick={onClick} className='rounded-button'>
            {children}
        </button>
    );
}

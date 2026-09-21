import type { ComponentChildren, JSX } from "preact";

export function RoundedButton({
    children,
    onClick,
    type = "default",
    "aria-label": ariaLabel,
}: {
    children: ComponentChildren;
    onClick: JSX.MouseEventHandler<HTMLButtonElement>;
    type?: "default" | "danger";
    "aria-label"?: string;
}) {
    return (
        <button type='button' data-type={type} aria-label={ariaLabel} onClick={onClick} className='rounded-button'>
            {children}
        </button>
    );
}

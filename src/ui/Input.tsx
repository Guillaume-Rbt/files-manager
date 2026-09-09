import { useState } from "preact/hooks";

export function buildTree({ onChange }: { onChange: (e: Event) => void }) {
    const [value, setValue] = useState("");

    return (
        <input
            type='text'
            value={value}
            onChange={(e) => {
                const nextValue = (e.currentTarget as HTMLInputElement).value;
                setValue(nextValue);
                onChange(e);
            }}
        />
    );
}

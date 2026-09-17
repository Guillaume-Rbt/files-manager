import { createContext, ComponentChildren } from "preact";
import { useState } from "preact/hooks";

const ToolbarContext = createContext({ set: (newState: any) => {}, state: {} });

function Toolbar({
    actions,
    children,
}: {
    actions: any[];
    children: ComponentChildren;
}) {
    const [state, setState] = useState({});

    const set = (newState: any) => {
        setState((prevState) => ({ ...prevState, ...newState }));
    };

    return (
        <ToolbarContext.Provider value={{ set, state }}>
            <div className='flex'>
                {actions.map((action, index) => (
                    <button key={index} onClick={action.onClick}>
                        {action.label}
                    </button>
                ))}
            </div>
            {children}
        </ToolbarContext.Provider>
    );
}

export { Toolbar, ToolbarContext };

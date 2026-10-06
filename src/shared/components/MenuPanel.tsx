import type { ReactNode } from 'react';

type MenuPanelProps = {
    children: ReactNode;
    className?: string;
};

export const MenuPanel = ({
    children,
    className = '',
}: MenuPanelProps) => {
    return (
        <main className="menu-scene">
            <div className="menu-panel">
                <img
                    className="menu-panel__background"
                    src="/assets/png/default/ui/menu/panel_menu.png"
                    alt=""
                />

                <div className={`menu-panel__content ${className}`}>
                    {children}
                </div>
            </div>
        </main>
    );
};
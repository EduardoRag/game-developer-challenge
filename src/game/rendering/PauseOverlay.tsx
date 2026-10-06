type PauseOverlayProps = {
    onResume: () => void;
    onMainMenu: () => void;
};

export const PauseOverlay = ({
    onResume,
    onMainMenu,
}: PauseOverlayProps) => {
    return (
        <div
            className="pause-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
        >
            <div className="pause-menu">
                <img
                    className="pause-menu__panel"
                    src="/assets/png/default/ui/menu/panel_menu.png"
                    alt=""
                />

                <div className="pause-menu__content">
                    <h1
                        id="pause-title"
                        className="pause-menu__title"
                    >
                        PAUSED
                    </h1>

                    <p className="pause-menu__subtitle">
                        Ready when you are.
                    </p>

                    <div className="pause-menu__actions">
                        <button
                            type="button"
                            className="menu-button"
                            onClick={onResume}
                        >
                            RESUME
                        </button>

                        <button
                            type="button"
                            className="menu-button"
                            aria-disabled="true"
                        >
                            OPTIONS
                        </button>

                        <button
                            type="button"
                            className="menu-button"
                            onClick={onMainMenu}
                        >
                            MAIN MENU
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
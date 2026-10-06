type PauseOverlayProps = {
    onResume: () => void;
};

export const PauseOverlay = ({
    onResume,
}: PauseOverlayProps) => {
    return (
        <div
            className="pause-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
        >
            <div className="pause-overlay__panel">
                <img
                    className="pause-overlay__background"
                    src="/assets/png/default/ui/menu/panel_menu.png"
                    alt=""
                />

                <div className="pause-overlay__content">
                    <h1 id="pause-title">PAUSED</h1>

                    <p>The battle is waiting for you.</p>

                    <button
                        type="button"
                        className="menu-button"
                        onClick={onResume}
                    >
                        RESUME
                    </button>
                </div>
            </div>
        </div>
    );
};
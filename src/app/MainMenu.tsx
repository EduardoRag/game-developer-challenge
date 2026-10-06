type MainMenuProps = {
    onPlay: () => void;
    onRanking: () => void;
    onHistory: () => void;
};

export const MainMenu = ({
    onPlay,
    onRanking,
    onHistory,
}: MainMenuProps) => {
    return (
        <main className="main-menu">
            <div className="main-menu__panel">
                <img
                    className="main-menu__panel-background"
                    src="/assets/png/default/ui/menu/panel_menu.png"
                    alt=""
                />

                <div className="main-menu__content">
                    <img
                        className="main-menu__title"
                        src="/assets/png/default/ui/menu/title_pirate_battle.png"
                        alt="Pirate Battle"
                    />

                    <nav
                        className="main-menu__actions"
                        aria-label="Main menu"
                    >
                        <button
                            type="button"
                            className="menu-button"
                            onClick={onPlay}
                        >
                            Play
                        </button>

                        <button
                            type="button"
                            className="menu-button"
                            onClick={onRanking}
                        >
                            Ranking
                        </button>

                        <button
                            type="button"
                            className="menu-button"
                            onClick={onHistory}
                        >
                            History
                        </button>
                    </nav>
                </div>
            </div>
        </main>
    );
};
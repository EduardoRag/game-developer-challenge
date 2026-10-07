import { MenuPanel } from '../shared/components/MenuPanel';

type MainMenuProps = {
    onPlay: () => void;
    onOptions: () => void;
    onRanking: () => void;
    onHistory: () => void;
    onControls: () => void;
};

export const MainMenu = ({
    onPlay,
    onOptions,
    onRanking,
    onHistory,
    onControls,
}: MainMenuProps) => {
    return (
        <MenuPanel
            panelClassName="main-menu__panel"
            className="main-menu__content"
        >
            <img
                className="main-menu__title"
                src="/assets/png/default/ui/menu/title_pirate_battle.png"
                alt="Pirate Battle"
            />

            <p className="main-menu__subtitle">
                SET SAIL. TAKE COMMAND.
            </p>

            <div className="main-menu__primary-actions">
                <button
                    type="button"
                    className="menu-button"
                    onClick={onPlay}
                >
                    PLAY
                </button>

                <button
                    type="button"
                    className="menu-button"
                    onClick={onOptions}
                >
                    OPTIONS
                </button>
            </div>

            <div className="main-menu__spacer" />

            <p className="main-menu__hint">
                Navigate the islands. Survive the battle.
            </p>

            <nav
                className="main-menu__secondary-actions"
                aria-label="Game records"
            >
                <button
                    type="button"
                    className="menu-button main-menu__secondary-button"
                    onClick={onRanking}
                >
                    RANKING
                </button>

                <button
                    type="button"
                    className="menu-button main-menu__secondary-button"
                    onClick={onControls}
                >
                    CONTROLS
                </button>

                <button
                    type="button"
                    className="menu-button main-menu__secondary-button"
                    onClick={onHistory}
                >
                    MATCH HISTORY
                </button>
            </nav>
        </MenuPanel>
    );
};
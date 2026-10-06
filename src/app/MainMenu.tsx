import { MenuPanel } from '../shared/components/MenuPanel';

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
        <MenuPanel className="main-menu__content">
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
        </MenuPanel>
    );
};
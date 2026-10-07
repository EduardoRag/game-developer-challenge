import { MenuPanel } from '../../shared/components/MenuPanel';

type ControlsScreenProps = {
    onBack: () => void;
};

type Control = {
    icon: string;
    key: string;
    label: string;
};

const CONTROL_ASSET_PATH = '/assets/png/default/ui/controls';

const movementControls: Control[] = [
    {
        icon: 'icon_forward.png',
        key: 'W / ↑',
        label: 'Move forward',
    },
    {
        icon: 'icon_turn_left.png',
        key: 'A / ←',
        label: 'Turn left',
    },
    {
        icon: 'icon_turn_right.png',
        key: 'D / →',
        label: 'Turn right',
    },
];

const combatControls: Control[] = [
    {
        icon: 'icon_fire_front.png',
        key: 'SPACE',
        label: 'Fire front',
    },
    {
        icon: 'icon_fire_left.png',
        key: 'Q',
        label: 'Fire left',
    },
    {
        icon: 'icon_fire_right.png',
        key: 'E',
        label: 'Fire right',
    },
];

const pauseControl: Control = {
    icon: 'icon_pause.png',
    key: 'ESC',
    label: 'Pause',
};

const ControlItem = ({ control }: { control: Control }) => {
    return (
        <div className="controls-screen__item">
            <img
                src={`${CONTROL_ASSET_PATH}/${control.icon}`}
                alt=""
                draggable={false}
            />

            <div className="controls-screen__description">
                <strong>{control.key}</strong>
                <span>{control.label}</span>
            </div>
        </div>
    );
};

export const ControlsScreen = ({
    onBack,
}: ControlsScreenProps) => {
    return (
        <MenuPanel
            className="controls-screen__content"
            panelClassName="controls-screen__panel"
        >
            <h1 className="controls-screen__title">
                CONTROLS
            </h1>

            <p className="controls-screen__subtitle">
                KEYBOARD
            </p>

            <div className="controls-screen__groups">
                <section className="controls-screen__group">
                    <h2>MOVEMENT</h2>

                    <div className="controls-screen__group-list">
                        {movementControls.map((control) => (
                            <ControlItem
                                key={control.key}
                                control={control}
                            />
                        ))}
                    </div>
                </section>

                <section className="controls-screen__group">
                    <h2>COMBAT</h2>

                    <div className="controls-screen__group-list">
                        {combatControls.map((control) => (
                            <ControlItem
                                key={control.key}
                                control={control}
                            />
                        ))}
                    </div>
                </section>
            </div>

            <div className="controls-screen__pause">
                <ControlItem control={pauseControl} />
            </div>

            <p className="controls-screen__touch-hint">
                On touch devices, use the on-screen controls.
            </p>

            <button
                type="button"
                className="menu-button controls-screen__back"
                onClick={onBack}
            >
                BACK
            </button>
        </MenuPanel>
    );
};
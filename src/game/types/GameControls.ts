export type GameControlsApi = {
    pause: () => void;
    resume: () => void;
    press: (key: string) => void;
    release: (key: string) => void;
    start: () => void;
};
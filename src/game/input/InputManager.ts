export class InputManager {
    private readonly pressedKeys = new Set<string>();
    private readonly justPressedKeys = new Set<string>();

    public start() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    public stop() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        this.clear();
    }

    public isPressed(...keys: string[]) {
        return keys.some((key) => this.pressedKeys.has(key));
    }

    public wasPressed(...keys: string[]) {
        return keys.some((key) => this.justPressedKeys.has(key));
    }

    public press(key: string) {
        if (!this.pressedKeys.has(key)) {
            this.justPressedKeys.add(key);
        }

        this.pressedKeys.add(key);
    }

    public release(key: string) {
        this.pressedKeys.delete(key);
    }

    public clearFrameState() {
        this.justPressedKeys.clear();
    }

    public clear() {
        this.pressedKeys.clear();
        this.justPressedKeys.clear();
    }

    private readonly handleKeyDown = (event: KeyboardEvent) => {
        this.press(event.code);
    };

    private readonly handleKeyUp = (event: KeyboardEvent) => {
        this.release(event.code);
    };
}
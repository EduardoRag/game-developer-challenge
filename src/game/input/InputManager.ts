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

        this.pressedKeys.clear();
        this.justPressedKeys.clear();
    }

    public isPressed(...keys: string[]) {
        return keys.some((key) => this.pressedKeys.has(key));
    }

    private readonly handleKeyDown = (event: KeyboardEvent) => {
        if (!this.pressedKeys.has(event.code)) {
            this.justPressedKeys.add(event.code);
        }

        this.pressedKeys.add(event.code);
    };

    private readonly handleKeyUp = (event: KeyboardEvent) => {
        this.pressedKeys.delete(event.code);
    };

    public wasPressed(...keys: string[]) {
        return keys.some((key) => this.justPressedKeys.has(key));
    }

    public clearFrameState() {
        this.justPressedKeys.clear();
    }
}
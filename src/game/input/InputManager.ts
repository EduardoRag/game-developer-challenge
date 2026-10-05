export class InputManager {
    private readonly pressedKeys = new Set<string>();

    public start() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    public stop() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);

        this.pressedKeys.clear();
    }

    public isPressed(...keys: string[]) {
        return keys.some((key) => this.pressedKeys.has(key));
    }

    private readonly handleKeyDown = (event: KeyboardEvent) => {
        this.pressedKeys.add(event.code);
    };

    private readonly handleKeyUp = (event: KeyboardEvent) => {
        this.pressedKeys.delete(event.code);
    };
}
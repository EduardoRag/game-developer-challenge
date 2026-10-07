type SoundName =
    | 'cannonBroadside'
    | 'cannonFire'
    | 'gameComplete'
    | 'gameOver'
    | 'gamePause'
    | 'gameResume'
    | 'gameStart'
    | 'oceanAmbience'
    | 'scorePoint'
    | 'shipExplosion'
    | 'shipSinking'
    | 'shipWoodHit'
    | 'shipCollision';

const SOUND_PATHS: Record<SoundName, string | string[]> = {
    cannonBroadside: '/assets/sounds/cannon_broadside.wav',
    cannonFire: [
        '/assets/sounds/cannon_fire_1.wav',
        '/assets/sounds/cannon_fire_2.wav',
        '/assets/sounds/cannon_fire_3.wav',
    ],
    gameComplete: '/assets/sounds/game_complete.wav',
    gameOver: '/assets/sounds/game_over.wav',
    gamePause: '/assets/sounds/game_pause.wav',
    gameResume: '/assets/sounds/game_resume.wav',
    gameStart: '/assets/sounds/game_start.wav',
    scorePoint: '/assets/sounds/score_point.wav',
    shipExplosion: [
        '/assets/sounds/ship_explosion_1.wav',
        '/assets/sounds/ship_explosion_2.wav',
    ],
    shipSinking: '/assets/sounds/ship_sinking.wav',
    shipWoodHit: [
        '/assets/sounds/ship_wood_hit_1.wav',
        '/assets/sounds/ship_wood_hit_2.wav',
    ],
    oceanAmbience: '/assets/sounds/ocean_ambience_loop.wav',
    shipCollision: '/assets/sounds/ship_collision.wav',
};

export class AudioManager {
    private readonly sounds = new Map<SoundName, HTMLAudioElement[]>();
    private ambience: HTMLAudioElement | null = null;
    private destroyed = false;
    private readonly soundIndexes = new Map<SoundName, number>();

    constructor() {
        for (const [name, paths] of Object.entries(SOUND_PATHS) as [
            SoundName,
            string | string[],
        ][]) {
            const soundPaths = Array.isArray(paths) ? paths : [paths];

            const audioElements = soundPaths.map((path) => {
                const audio = new Audio(path);
                audio.preload = 'auto';

                return audio;
            });

            this.sounds.set(name, audioElements);
        }

        this.ambience = this.sounds.get('oceanAmbience')?.[0] ?? null;

        if (this.ambience) {
            this.ambience.loop = true;
            this.ambience.volume = 0.25;
        }
    }

    public play(name: SoundName, volume = 0.6) {
        if (this.destroyed) {
            return;
        }

        const sounds = this.sounds.get(name);

        if (!sounds?.length) {
            return;
        }

        const sound =
            sounds.length === 1
                ? sounds[0]
                : sounds[this.getNextSoundIndex(name, sounds.length)];

        sound.currentTime = 0;
        sound.volume = volume;

        void sound.play().catch(() => {
            // Audio must never affect gameplay if playback is unavailable.
        });
    }

    public startAmbience() {
        if (!this.ambience || this.destroyed) {
            return;
        }

        this.ambience.volume = 0.25;

        void this.ambience.play().catch(() => {
            // Browsers may reject playback before a user interaction.
        });
    }

    public pauseAmbience() {
        this.ambience?.pause();
    }

    public resumeAmbience() {
        if (!this.ambience || this.destroyed) {
            return;
        }

        void this.ambience.play().catch(() => {
            // Audio playback failure must not affect the game.
        });
    }

    public stopAmbience() {
        if (!this.ambience) {
            return;
        }

        this.ambience.pause();
        this.ambience.currentTime = 0;
    }

    private getNextSoundIndex(name: SoundName, soundCount: number) {
        const currentIndex = this.soundIndexes.get(name) ?? 0;

        this.soundIndexes.set(
            name,
            (currentIndex + 1) % soundCount,
        );

        return currentIndex;
    }

    public destroy() {
        this.destroyed = true;

        for (const sounds of this.sounds.values()) {
            for (const sound of sounds) {
                sound.pause();
                sound.currentTime = 0;
                sound.src = '';
            }
        }

        this.sounds.clear();
        this.soundIndexes.clear();
        this.ambience = null;
    }
}
export const GAME_CONFIG = {
    player: {
        maxHealth: 100,
        moveSpeed: 180,
        rotationSpeed: 2.5,

        fireCooldown: {
            front: 0.7,
            broadside: 1.2,
        },
    },

    enemy: {
        chaser: {
            maxHealth: 50,
            moveSpeed: 100,
            contactDamage: 20,
            contactDamageCooldown: 1,
        },
    },

    projectile: {
        speed: 500,
        damage: 25
    },

    world: {
        tileSize: 64,
    },
} as const;
export const GAME_CONFIG = {
    session: {
        duration: 120,
    },

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
        spawn: {
            interval: 5,
        },

        chaser: {
            maxHealth: 50,
            moveSpeed: 100,
            contactDamage: 20,
        },

        shooter: {
            maxHealth: 50,
            moveSpeed: 70,
            minDistance: 220,
            preferredDistance: 300,
            fireRange: 400,
            fireCooldown: 1.5,
        },
    },

    projectile: {
        speed: 500,
        playerDamage: 15,
        enemyDamage: 15,
    },

    world: {
        tileSize: 64,
    },

    responsive: {
        mobileLandscapeMaxHeight: 500,
        mobileLandscapeScale: 0.6,
    },
} as const;
export const GAME_CONFIG = {
    session: {
        duration: 10,
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
            contactDamageCooldown: 1,
            score: 100,
        },

        shooter: {
            maxHealth: 50,
            moveSpeed: 70,
            minDistance: 220,
            preferredDistance: 300,
            fireRange: 400,
            fireCooldown: 1.5,
            score: 150,
        },
    },

    projectile: {
        speed: 500,
        playerDamage: 25,
        enemyDamage: 15,
    },

    world: {
        tileSize: 64,
    },
} as const;
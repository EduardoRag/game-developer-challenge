import type { CreateSessionRequest } from '../../infrastructure/api/types';

const LAST_COMPLETED_SESSION_KEY =
    'pirate-battle-last-completed-session';

const PENDING_SESSION_KEY =
    'pirate-battle-pending-session';

const parseStoredValue = <T>(
    value: string | null,
): T | null => {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        return null;
    }
};

export const saveLastCompletedSession = (
    session: CreateSessionRequest,
) => {
    localStorage.setItem(
        LAST_COMPLETED_SESSION_KEY,
        JSON.stringify(session),
    );
};

export const loadLastCompletedSession =
    (): CreateSessionRequest | null =>
        parseStoredValue<CreateSessionRequest>(
            localStorage.getItem(
                LAST_COMPLETED_SESSION_KEY,
            ),
        );

export const savePendingSession = (
    session: CreateSessionRequest,
) => {
    localStorage.setItem(
        PENDING_SESSION_KEY,
        JSON.stringify(session),
    );
};

export const loadPendingSession =
    (): CreateSessionRequest | null =>
        parseStoredValue<CreateSessionRequest>(
            localStorage.getItem(PENDING_SESSION_KEY),
        );

export const clearPendingSession = (
    sessionId: string,
) => {
    const pendingSession = loadPendingSession();

    if (pendingSession?.id !== sessionId) {
        return;
    }

    localStorage.removeItem(PENDING_SESSION_KEY);
};
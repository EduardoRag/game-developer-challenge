export type MockScenario =
    | 'success'
    | 'empty'
    | 'latency'
    | 'network-error'
    | 'server-error'
    | 'registration-timeout'
    | 'registration-unavailable';

const DEFAULT_SCENARIO: MockScenario = 'success';

const isMockScenario = (value: string): value is MockScenario =>
    [
        'success',
        'empty',
        'latency',
        'network-error',
        'server-error',
        'registration-timeout',
        'registration-unavailable',
    ].includes(value);

export const getMockScenario = (): MockScenario => {
    const scenario = new URLSearchParams(window.location.search).get(
        'mockScenario',
    );

    if (!scenario || !isMockScenario(scenario)) {
        return DEFAULT_SCENARIO;
    }

    return scenario;
};
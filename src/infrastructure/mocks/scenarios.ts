export type MockScenario =
    | 'success'
    | 'empty'
    | 'latency'
    | 'network-error'
    | 'server-error'
    | 'registration-timeout'
    | 'registration-unavailable'
    | 'asset-error';

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
        'asset-error',
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
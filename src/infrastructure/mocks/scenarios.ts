export type MockScenario =
    | 'success'
    | 'empty'
    | 'latency'
    | 'variable-latency'
    | 'network-error'
    | 'client-error'
    | 'server-error'
    | 'registration-timeout'
    | 'registration-unavailable'
    | 'asset-error';

const DEFAULT_SCENARIO: MockScenario = 'success';

const MOCK_SCENARIOS: MockScenario[] = [
    'success',
    'empty',
    'latency',
    'variable-latency',
    'network-error',
    'client-error',
    'server-error',
    'registration-timeout',
    'registration-unavailable',
    'asset-error',
];

const isMockScenario = (
    value: string,
): value is MockScenario =>
    MOCK_SCENARIOS.includes(value as MockScenario);

export const getMockScenario = (): MockScenario => {
    const scenario = new URLSearchParams(
        window.location.search,
    ).get('mockScenario');

    if (!scenario || !isMockScenario(scenario)) {
        return DEFAULT_SCENARIO;
    }

    return scenario;
};
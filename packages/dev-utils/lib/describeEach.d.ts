export interface TestCase {
    label: string;
}
export declare function describeEach<T extends TestCase>(testCases: T[], fn: (testCase: T) => void): void;

import Web3 from 'web3';
export declare const NetworkConfig: {
    downtimeSlasher: {
        slashableDowntime: number;
    };
    epochRewards: {
        frozen: boolean;
    };
    exchange: {
        frozen: boolean;
        minimumReports: number;
    };
    goldToken: {
        frozen: boolean;
    };
    governance: {
        dequeueFrequency: number;
        queueExpiry: number;
        approvalStageDuration: number;
        referendumStageDuration: number;
        executionStageDuration: number;
        minDeposit: number;
        concurrentProposals: number;
    };
    governanceApproverMultiSig: {
        signatories: string[];
        numRequiredConfirmations: number;
    };
    oracles: {
        reportExpiry: number;
    };
    reserve: {
        initialBalance: number;
        otherAddresses: string[];
    };
    reserveSpenderMultiSig: {
        signatories: string[];
        numRequiredConfirmations: number;
    };
    stableToken: {
        goldPrice: number;
        initialBalances: {
            addresses: string[];
            values: string[];
        };
        oracles: string[];
        frozen: boolean;
    };
    validators: {
        commissionUpdateDelay: number;
    };
};
export declare function jsonRpcCall<O>(web3: Web3, method: string, params: any[]): Promise<O>;
export declare function timeTravel(seconds: number, web3: Web3): Promise<void>;
export declare function mineBlocks(blocks: number, web3: Web3): Promise<void>;
export declare function evmRevert(web3: Web3, snapId: string): Promise<void>;
export declare function evmSnapshot(web3: Web3): Promise<string>;
export declare function testWithGanache(name: string, fn: (web3: Web3) => void): void;
/**
 * Gets a contract address by parsing blocks and matching event signatures against the given event.
 * `canValidate` actually controls whether we grab the first or second contract associated with
 * the given `eventSignature`. This is to allow for deployment of two contracts with distinct
 * setup parameters for testing.
 */
export declare function getContractFromEvent(eventSignature: string, web3: Web3, canValidate: boolean): Promise<string>;

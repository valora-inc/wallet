export declare const ACCOUNT_PRIVATE_KEYS: string[];
export declare const ACCOUNT_ADDRESSES: string[];
export declare function startGanache(filePath: string, datafile: string, opts?: {
    verbose?: boolean;
    from_targz?: boolean;
}): Promise<() => Promise<unknown>>;
export default function setup(filePath: string, datafile: string, opts?: {
    verbose?: boolean;
    from_targz?: boolean;
}): Promise<void>;
export declare function emptySetup(opts?: {
    verbose?: boolean;
    from_targz?: boolean;
}): Promise<void>;

// For some reason we need this specific path for typescript to pickup the right types
// otherwise with just '@walletconnect/type' it doesn't them
// likely caused by the fact we import 2 different versions of the same package
// for v1 and v2
export * from '@walletconnect/types/dist/cjs'

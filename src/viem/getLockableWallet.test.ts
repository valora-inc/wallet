import { normalizeAddress } from '@celo/utils/lib/address'
import erc20 from 'src/abis/IERC20.json'
import getLockableViemWallet, { ViemWallet, getTransport } from 'src/viem/getLockableWallet'
import { KeychainLock } from 'src/web3/KeychainLock'
import * as mockedKeychain from 'test/mockedKeychain'
import { mockAccount2, mockContractAddress, mockPrivateDEK, mockTypedData } from 'test/values'
import {
  sendTransaction,
  signMessage,
  signTransaction,
  signTypedData,
  writeContract,
} from 'viem/actions'
import { celoAlfajores, sepolia as ethereumSepolia, goerli as ethereumGoerli } from 'viem/chains'
import { viemTransports } from 'src/viem'
import { http } from 'viem'
import { Network } from 'src/transactions/types'

jest.mock('viem/actions')
jest.mock('src/viem', () => {
  return {
    viemTransports: {
      celo: 'celoTransport',
      ethereum: 'ethereumTransport',
    },
  }
})

describe('getTransport', () => {
  it.each([
    [celoAlfajores, 'celoTransport'],
    [ethereumSepolia, 'ethereumTransport'],
  ])('returns correct transport for $s', (chain, expectedTransport) => {
    expect(getTransport(chain)).toEqual(expectedTransport)
  })
  it('throws if chain not found', () => {
    expect(() => getTransport(ethereumGoerli)).toThrow()
  })
})

const methodsParams: Record<string, any> = {
  sendTransaction: {
    account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    to: '0x0000000000000000000000000000000000000000',
    value: BigInt(1),
  },
  signTransaction: {
    account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    to: '0x0000000000000000000000000000000000000000',
    value: BigInt(1),
  },
  signTypedData: mockTypedData,
  signMessage: {
    account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
    message: 'hello world',
  },
  writeContract: {
    address: mockContractAddress,
    abi: erc20.abi,
    functionName: 'mint',
    account: mockAccount2,
    chain: celo,
    args: [],
  },
}

describe('getLockableWallet', () => {
  let wallet: ViemWallet
  let lock: KeychainLock

  beforeEach(() => {
    viemTransports[Network.Celo] = http()
    viemTransports[Network.Ethereum] = http()
    lock = new KeychainLock()
    wallet = getLockableViemWallet(lock, celoAlfajores, `0x${mockPrivateDEK}`)
  })

  it.each([
    ['sendTransaction', (args: any) => wallet.sendTransaction(args)],
    ['signTransaction', (args: any) => wallet.signTransaction(args)],
    ['signTypedData', (args: any) => wallet.signTypedData(args)],
    ['signMessage', (args: any) => wallet.signMessage(args)],
    ['writeContract', (args: any) => wallet.writeContract(args)],
  ])('cannot call %s if not unlocked', (methodName, methodCall) => {
    expect(() => methodCall(methodsParams[methodName])).toThrowError(
      'authentication needed: password or unlock'
    )
  })

  it.each([
    { method: sendTransaction, methodCall: (args: any) => wallet.sendTransaction(args) },
    { method: signTransaction, methodCall: (args: any) => wallet.signTransaction(args) },
    { method: signTypedData, methodCall: (args: any) => wallet.signTypedData(args) },
    { method: signMessage, methodCall: (args: any) => wallet.signMessage(args) },
    { method: writeContract, methodCall: (args: any) => wallet.writeContract(args) },
  ])('can call $method.name if unlocked', async ({ method, methodCall }) => {
    // Adding account to the lock and keychain
    const date = new Date()
    lock.addAccount({ address: wallet.account?.address as string, createdAt: date })
    mockedKeychain.setItems({
      [`account--${date.toISOString()}--${normalizeAddress(wallet.account?.address as string)}`]: {
        password: 'password',
      },
    })

    const unlocked = await wallet.unlockAccount('password', 100)
    expect(unlocked).toBe(true)
    expect(() => methodCall(methodsParams[method.name])).not.toThrowError(
      'authentication needed: password or unlock'
    )
    expect(method).toHaveBeenCalledWith(expect.anything(), methodsParams[method.name])
  })
})

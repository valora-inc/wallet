import { normalizeAddress } from '@celo/utils/lib/address'
import erc20 from 'src/abis/IERC20.json'
import getLockableViemWallet, { ViemWallet, getTransport } from 'src/viem/getLockableWallet'
import { KeychainLock } from 'src/web3/KeychainLock'
import * as mockedKeychain from 'test/mockedKeychain'
import { mockAccount2, mockContractAddress, mockPrivateDEK } from 'test/values'
import { writeContract } from 'viem/actions'
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

describe('getLockableWallet', () => {
  let wallet: ViemWallet
  let lock: KeychainLock
  let writeContractConfig: any

  beforeEach(() => {
    viemTransports[Network.Celo] = http()
    viemTransports[Network.Ethereum] = http()
    lock = new KeychainLock()
    wallet = getLockableViemWallet(lock, celoAlfajores, `0x${mockPrivateDEK}`)
    writeContractConfig = {
      address: mockContractAddress,
      abi: erc20.abi,
      functionName: 'mint',
      account: mockAccount2,
      chain: celoAlfajores,
      args: [],
    }
  })
  it('cannot call writeContract if not unlocked', () => {
    expect(() => wallet.writeContract(writeContractConfig)).toThrowError(
      'authentication needed: password or unlock'
    )
  })
  it('can call writeContract if unlocked', async () => {
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
    expect(() => wallet.writeContract(writeContractConfig)).not.toThrowError(
      'authentication needed: password or unlock'
    )
    expect(writeContract).toHaveBeenCalledWith(expect.anything(), writeContractConfig)
  })
})

import { normalizeAddress } from '@celo/utils/lib/address'
import erc20 from 'src/abis/IERC20.json'
import getLockableViemWallet, { ViemWallet } from 'src/viem/getLockableWallet'
import { KeychainLock } from 'src/web3/KeychainLock'
import * as mockedKeychain from 'test/mockedKeychain'
import { mockAccount2, mockContractAddress, mockPrivateDEK } from 'test/values'
import { writeContract } from 'viem/actions'
import { celo } from 'viem/chains'

jest.mock('viem/actions')

describe('getLockableWallet', () => {
  let wallet: ViemWallet
  let lock: KeychainLock
  let writeContractConfig: any

  beforeEach(() => {
    lock = new KeychainLock()
    wallet = getLockableViemWallet(lock, celo, `0x${mockPrivateDEK}`)
    writeContractConfig = {
      address: mockContractAddress,
      abi: erc20.abi,
      functionName: 'mint',
      account: mockAccount2,
      chain: celo,
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

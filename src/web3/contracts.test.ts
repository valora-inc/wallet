import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { getPasswordSaga } from 'src/pincode/authentication'
import getLockableViemWallet, { ViemWallet } from 'src/viem/getLockableWallet'
import { getStoredPrivateKey, listStoredAccounts } from 'src/web3/KeychainAccounts'
import { walletAddressSelector } from 'src/web3/selectors'
import { celo } from 'viem/chains'
import { getKeychainAccounts as getKeychainAccountsFn, getViemWallet } from './contracts'

jest.unmock('src/web3/contracts')
jest.mock('src/viem/getLockableWallet')

let getKeychainAccounts: typeof getKeychainAccountsFn
let loadExistingAccountsSpy: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  // Isolate the module so its variables don't persist between tests
  // Note: this slows down the tests a bit
  jest.isolateModules(() => {
    getKeychainAccounts = require('./contracts').getKeychainAccounts
    loadExistingAccountsSpy = jest.spyOn(
      require('src/web3/KeychainAccounts').KeychainAccounts.prototype,
      'loadExistingAccounts'
    )
  })
})

describe('getKeychainAccounts', () => {
  it('should initialize keychain accounts', async () => {
    const keychainAccounts = await getKeychainAccounts()
    expect(keychainAccounts).toBeDefined()
    expect(loadExistingAccountsSpy).toHaveBeenCalledTimes(1)
  })

  it('should only load existing accounts once', async () => {
    const [a1, a2, a3] = await Promise.all([
      getKeychainAccounts(),
      getKeychainAccounts(),
      getKeychainAccounts(),
    ])
    expect(loadExistingAccountsSpy).toHaveBeenCalledTimes(1)
    expect(a1).toBe(a2)
    expect(a2).toBe(a3)
  })

  it('should throw if knex fails to initialize', async () => {
    loadExistingAccountsSpy.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    await expect(getKeychainAccounts()).rejects.toThrow('Test error')
  })

  it('should keep failed initializations', async () => {
    loadExistingAccountsSpy.mockImplementationOnce(() => {
      throw new Error('Test error')
    })
    await expect(getKeychainAccounts()).rejects.toThrow('Test error')
    await expect(getKeychainAccounts()).rejects.toThrow('Test error')
    expect(loadExistingAccountsSpy).toHaveBeenCalledTimes(1)
  })
})

describe('getViemWallet', () => {
  it('throws if address not found', async () => {
    return expect(
      expectSaga(getViemWallet, celo)
        .provide([[select(walletAddressSelector), null]])
        .run()
    ).rejects.toThrowError('Wallet address not found')
  })
  it('returns a lockable wallet', async () => {
    const date = new Date()

    jest.mocked(getLockableViemWallet).mockReturnValue('foo' as unknown as ViemWallet)
    await expectSaga(getViemWallet, celo)
      .provide([
        [select(walletAddressSelector), '0x123'],
        [call(listStoredAccounts), [{ address: '0x123', createdAt: date }]],
        [call(getPasswordSaga, '0x123', true, false), 'password'],
        [
          call(getStoredPrivateKey, { address: '0x123', createdAt: new Date() }, 'password'),
          'password',
        ],
      ])
      .returns('foo')
      .run()

    expect(getLockableViemWallet).toHaveBeenCalledTimes(1)

    // Verifying that the wallet is cached
    await expectSaga(getViemWallet, celo).returns('foo').run()
    expect(getLockableViemWallet).toHaveBeenCalledTimes(1)

    // get a wallet with app transport and ensure it is not from the cache
    await expectSaga(getViemWallet, celo, true)
      .provide([
        [select(walletAddressSelector), '0x123'],
        [call(listStoredAccounts), [{ address: '0x123', createdAt: date }]],
        [call(getPasswordSaga, '0x123', true, false), 'password'],
        [
          call(getStoredPrivateKey, { address: '0x123', createdAt: new Date() }, 'password'),
          'password',
        ],
      ])
      .returns('foo')
      .run()

    expect(getLockableViemWallet).toHaveBeenCalledTimes(2)

    // Verifying that the app transport wallet is cached
    await expectSaga(getViemWallet, celo, true).returns('foo').run()
    expect(getLockableViemWallet).toHaveBeenCalledTimes(2)
  })
})

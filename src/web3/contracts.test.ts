import { expectSaga } from 'redux-saga-test-plan'
import { call, select } from 'redux-saga/effects'
import { getPasswordSaga } from 'src/pincode/authentication'
import getLockableViemWallet, { ViemWallet } from 'src/viem/getLockableWallet'
import { getStoredPrivateKey, listStoredAccounts } from 'src/web3/KeychainLock'
import { walletAddressSelector } from 'src/web3/selectors'
import { celo } from 'viem/chains'
import { getViemWallet } from './contracts'

jest.mock('src/viem/getLockableWallet')

describe('getViemWallet', () => {
  it('throws if address not found', async () => {
    return expect(
      expectSaga(getViemWallet, celo)
        .provide([
          [select(walletAddressSelector), null],
          [call(listStoredAccounts), []],
          [call(getPasswordSaga, 'hi', false, true), 'password'],
          [
            call(getStoredPrivateKey, { address: '0x123', createdAt: new Date() }, 'password'),
            'privateKey',
          ],
        ])
        .run()
    ).rejects.toThrowError('Wallet address not found')
  })
  it('throws if the address is not found on the Keychain', () => {
    const date = new Date()
    return expect(
      expectSaga(getViemWallet, celo)
        .provide([
          [select(walletAddressSelector), '0x123'],
          [call(listStoredAccounts), [{ address: '0x456', createdAt: date }]],
        ])
        .run()
    ).rejects.toThrowError(`Account 0x123 not found in Keychain`)
  })
  it('throws if the private key is not found for the given password', () => {
    const date = new Date()

    return expect(
      expectSaga(getViemWallet, celo)
        .provide([
          [select(walletAddressSelector), '0x123'],
          [call(listStoredAccounts), [{ address: '0x123', createdAt: date }]],
          [call(getPasswordSaga, '0x123', true, false), 'password'],
          [
            call(getStoredPrivateKey, { address: '0x123', createdAt: new Date() }, 'password'),
            null,
          ],
        ])
        .run()
    ).rejects.toThrowError(`Private key not found for account 0x123`)
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
  })
})

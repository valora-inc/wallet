import { normalizeAddressWith0x } from '@celo/utils/lib/address'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { getEthersWallet } from 'src/ethers/saga'
import { Chain } from 'src/ethers/types'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import { getWallet } from 'src/web3/contracts'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount2 } from 'test/values'
import { mocked } from 'ts-jest/utils'

jest.mock('src/web3/contracts', () => ({
  getWallet: jest.fn(),
}))

describe('getEthersWallet', () => {
  it('errors if keychainwallet is undefined', async () => {
    // @ts-ignore
    mocked(getWallet).mockResolvedValueOnce(undefined)
    await expect(expectSaga(getEthersWallet, Chain.Celo).call(getWallet).run()).rejects.toThrow(
      'KeychainWallet not set. Should never happen'
    )
  })
  it('errors if walletAddress is undefined', async () => {
    // @ts-ignore
    mocked(getWallet).mockResolvedValueOnce(
      new KeychainWallet({
        createdAt: new Date(),
        address: null,
      })
    )
    await expect(
      expectSaga(getEthersWallet, Chain.Celo)
        .provide([[select(walletAddressSelector), null]])
        .call(getWallet)
        .run()
    ).rejects.toThrow('Wallet address not set. Should never happen')
  })
  it('errors if the ethers wallet for the given chain and walletAddress is not defined', async () => {
    // @ts-ignore
    mocked(getWallet).mockResolvedValueOnce(
      new KeychainWallet({
        createdAt: new Date(),
        address: mockAccount2,
      })
    )
    // without running keychainWallet.init we can't get the ethers wallet
    await expect(
      expectSaga(getEthersWallet, Chain.Celo)
        .provide([[select(walletAddressSelector), mockAccount2]])
        .call(getWallet)
        .run()
    ).rejects.toThrow(`Could not find address ${normalizeAddressWith0x(mockAccount2)}`)
  })
  it('returns the ethers wallet for the given chain and walletAddress', async () => {
    const keychainWallet = new KeychainWallet({
      createdAt: new Date(),
      address: mockAccount2,
    })
    await keychainWallet.init()
    // @ts-ignore
    mocked(getWallet).mockResolvedValueOnce(keychainWallet)
    const ethersWallet = expectSaga(getEthersWallet, Chain.Celo)
      .provide([[select(walletAddressSelector), mockAccount2]])
      .call(getWallet)
      .run()
    expect(ethersWallet).toBeDefined()
  })
})

import { act } from '@testing-library/react-native'
import MockDate from 'mockdate'
import Wallet from 'src/ethers/Wallet'
import { Chain } from 'src/ethers/types'
import ContractKitSigner from 'src/web3/ContractKitSigner'
import { KeychainAccountManager, clearStoredAccounts } from 'src/web3/KeychainAccountManager'
import * as mockedKeychain from 'test/mockedKeychain'
jest.mock('src/web3/ContractKitSigner')
jest.mock('src/ethers/Wallet')

describe(clearStoredAccounts, () => {
  it('only clears the stored accounts', async () => {
    mockedKeychain.setItems({
      'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
        password: 'encrypted password',
      },
      'unrelated item': {
        password: 'unrelated password',
      },
      'account--2021-01-10T11:14:50.298Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb': {
        password: 'encrypted password2',
      },
    })

    await expect(clearStoredAccounts()).resolves.toBe(undefined)

    expect(mockedKeychain.getAllKeys()).toEqual(['unrelated item'])
  })
})

describe(KeychainAccountManager, () => {
  beforeEach(() => {
    MockDate.reset()
  })
  it('can be unlocked', async () => {
    const address = '0x588e4b68193001e4d10928660ab4165b813717c0'
    const account = new KeychainAccountManager({
      address,
      createdAt: new Date('2022-05-25T11:14:50.292Z'),
    })
    await account.init('0x123', 'password')
    expect(account.isUnlocked()).toBe(false)
    expect(() => account.unlockedContractKitSigner).toThrow()
    expect(() => account.unlockedEthersWallets).toThrow()
    const unlocked = await account.unlock('password', 1000)
    expect(unlocked).toBe(true)
    expect(account.isUnlocked()).toBe(true)
    expect(account.unlockedContractKitSigner).toBeInstanceOf(ContractKitSigner)
    expect(account.unlockedEthersWallets.get(Chain.Celo)).toBeInstanceOf(Wallet)
  })
  it('locks both wallet and signer when lock duration runs its course', async () => {
    const dateNow = Date.now()
    MockDate.set(dateNow)
    const address = '0x588e4b68193001e4d10928660ab4165b813717c0'
    const account = new KeychainAccountManager({
      address,
      createdAt: new Date(),
    })
    await account.init('0x123', 'password')
    await account.unlock('password', 1) // 1 second
    expect(account.isUnlocked()).toBe(true)

    await act(() => {
      MockDate.set(dateNow + 1200) // 1.2 seconds later
    })
    expect(account.isUnlocked()).toBe(false)
    expect(() => account.unlockedContractKitSigner).toThrow()
    expect(() => account.unlockedEthersWallets).toThrow()
  })
})

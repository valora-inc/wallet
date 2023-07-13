import WalletManager from 'src/web3/WalletManager'
import { ImportMnemonicAccount } from 'src/web3/KeychainSigner'
import * as mockedKeychain from 'test/mockedKeychain'
import { Chain } from 'src/ethers/types'

const MOCK_IMPORT_MNEMONIC_ACCOUNT: ImportMnemonicAccount = {
  address: '0x1234567890123456789012345678901234567890',
  createdAt: new Date(1482363367071),
}

describe('WalletManager', () => {
  let walletManager: WalletManager
  beforeEach(() => {
    jest.clearAllMocks()
    mockedKeychain.clearAllItems()
    walletManager = new WalletManager(MOCK_IMPORT_MNEMONIC_ACCOUNT)
  })

  describe('getContractKitWallet', () => {
    it('throws if not init', () => {
      expect(() => walletManager.getContractKitWallet()).toThrow(
        new Error(`No contractkit wallet found. Must call init first.`)
      )
    })
    it('returns contractkit-based wallet', async () => {
      await walletManager.init()
      expect(() => walletManager.getContractKitWallet()).not.toThrow()
    })
  })
  describe('getEthersWallet', () => {
    it('throws if not init', async () => {
      expect(() => walletManager.getEthersWallet(Chain.Celo)).toThrow(
        new Error(`No Ethers wallet found for chain Celo. Must call init first.`)
      )
    })
    it('returns ethers wallet for selected chain', async () => {
      await walletManager.init()
      expect(() => walletManager.getEthersWallet(Chain.Celo)).not.toThrow()
    })
  })
})

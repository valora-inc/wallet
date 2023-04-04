import '@ethersproject/shims'
import { ethers } from 'ethers'
import { IERC20 } from 'src/abis/types'
import { getStoredMnemonic } from 'src/backup/utils'
import { DEFAULT_FORNO_URL } from 'src/config'

let ethersWallet: ethers.Wallet | undefined
let celoProvider: ethers.providers.JsonRpcProvider | undefined

type CeloAdditionalTransferParams = {
  feeCurrency?: string
  gatewayFeeRecipient?: string
  gatewayFee?: ethers.BigNumber
}

export type CeloIERC20 = Omit<IERC20, 'transfer'> &
  Omit<IERC20, 'transfer'> & {
    transfer: (
      recipient: Parameters<IERC20['transfer']>[0],
      amount: Parameters<IERC20['transfer']>[1],
      overrides?: Parameters<IERC20['transfer']>[2] & CeloAdditionalTransferParams
    ) => ReturnType<IERC20['transfer']>
  }

export async function initEthersWallet(account: string) {
  const mnemonic = await getStoredMnemonic(account)
  if (!mnemonic) throw new Error('No mnemonic found for account')
  ethersWallet = ethers.Wallet.fromMnemonic(mnemonic)
}

export async function initCeloProvider() {
  celoProvider = new ethers.providers.JsonRpcProvider(DEFAULT_FORNO_URL)
}

export async function getEthersWallet(account: string) {
  if (!ethersWallet) {
    await initEthersWallet(account)
  }
  return ethersWallet
}

export async function getCeloProvider() {
  if (!celoProvider) {
    await initCeloProvider()
  }
  return celoProvider
}

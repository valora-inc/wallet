import Logger from 'src/utils/Logger'
import { KeychainLock } from 'src/web3/KeychainLock'
import {
  Account,
  Address,
  Chain,
  Client,
  Transport,
  WalletActions,
  WalletRpcSchema,
  createWalletClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { viemTransports } from 'src/viem'
import networkConfig from 'src/web3/networkConfig'
import { Network } from 'src/transactions/types'
import { sendRawTransaction, signTransaction, writeContract, sendTransaction } from 'viem/actions'

const TAG = 'viem/getLockableWallet'

export function getTransport(chain: Chain): Transport {
  const result = Object.entries(networkConfig.viemChain).find(
    ([_, viemChain]) => chain === viemChain
  )
  if (!result) {
    throw new Error(`No network defined for viem chain ${chain}, cannot create wallet`)
  }
  return viemTransports[result[0] as Network]
}

// Largely copied from https://github.com/wagmi-dev/viem/blob/main/src/clients/createWalletClient.ts#L32
export type ViemWallet<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined
> = Client<transport, chain, account, WalletRpcSchema, Actions>

type Actions = {
  sendTransaction: WalletActions['sendTransaction']
  unlockAccount: (passphrase: string, duration: number) => Promise<boolean>
  writeContract: WalletActions['writeContract']
  signTransaction: WalletActions['signTransaction']
  sendRawTransaction: WalletActions['sendRawTransaction']
}

export default function getLockableViemWallet(
  lock: KeychainLock,
  chain: Chain,
  privateKey: Address
): ViemWallet {
  const account = privateKeyToAccount(privateKey)
  Logger.debug(TAG, `getting viem wallet for ${account.address} on ${chain.name}`)
  const checkLock = () => {
    if (!lock.isUnlocked(account.address)) {
      throw new Error('authentication needed: password or unlock')
    }
  }

  return createWalletClient({
    chain,
    transport: getTransport(chain),
    account,
  }).extend((client: Client): Actions => {
    return {
      // All wallet functions that we want our ViemWallet to have must go here
      // For instance we will later need signTransaction which we can add here by
      // importing the signTransaction action and blocking it with the checkLock function
      // Introduction to wallet actions: https://viem.sh/docs/actions/wallet/introduction.html
      sendTransaction: (args) => sendTransaction(client, args),
      unlockAccount: (passphrase: string, duration: number) =>
        lock.unlock(account.address, passphrase, duration),
      writeContract: (args) => {
        checkLock()
        return writeContract(client, args)
      },
      signTransaction: (args) => {
        checkLock()
        return signTransaction(client, args)
      },
      sendRawTransaction: (args) => {
        return sendRawTransaction(client, args)
      },
    }
  })
}

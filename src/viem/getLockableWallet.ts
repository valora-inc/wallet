import { Network } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { viemTransports } from 'src/viem'
import { KeychainLock } from 'src/web3/KeychainLock'
import networkConfig from 'src/web3/networkConfig'
import {
  Account,
  Address,
  Chain,
  Client,
  PrivateKeyAccount,
  Transport,
  WalletActions,
  WalletRpcSchema,
  createWalletClient,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
  sendRawTransaction,
  sendTransaction,
  signMessage,
  signTransaction,
  signTypedData,
  writeContract,
} from 'viem/actions'
import { Prettify } from 'viem/chains'

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

// Largely copied from https://github.com/wevm/viem/blob/43df39918f990c039b322c05e7130721f7117bbd/src/clients/createWalletClient.ts#L38
export type ViemWallet<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = Prettify<Client<transport, chain, account, WalletRpcSchema, Actions<chain, account>>>

type Actions<
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined,
> = Pick<
  WalletActions<chain, account>,
  | 'sendRawTransaction'
  | 'sendTransaction'
  | 'signTransaction'
  | 'signTypedData'
  | 'signMessage'
  | 'writeContract'
> & { unlockAccount: (passphrase: string, duration: number) => Promise<boolean> }

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
  }).extend((client): Actions<Chain, PrivateKeyAccount> => {
    return {
      // All wallet functions that we want our ViemWallet to have must go here
      // For instance we will later need prepareTransactionRequest which we can add here by
      // importing the prepareTransactionRequest action and blocking it with the checkLock function
      // Introduction to wallet actions: https://viem.sh/docs/actions/wallet/introduction.html
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
      sendTransaction: (args) => {
        checkLock()
        return sendTransaction(client, args)
      },
      signTypedData: (args) => {
        checkLock()
        return signTypedData(client, args)
      },
      signMessage: (args) => {
        checkLock()
        return signMessage(client, args)
      },
    }
  })
}

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
  http,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { writeContract } from 'viem/actions'

const TAG = 'viem/getLockableWallet'

// Largely copied from https://github.com/wagmi-dev/viem/blob/main/src/clients/createWalletClient.ts#L32
export type ViemWallet<
  transport extends Transport = Transport,
  chain extends Chain | undefined = Chain | undefined,
  account extends Account | undefined = Account | undefined
> = Client<transport, chain, account, WalletRpcSchema, Actions>

type Actions = {
  writeContract: WalletActions['writeContract']
  unlockAccount: (passphrase: string, duration: number) => Promise<boolean>
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
    transport: http(),
    account,
  }).extend((client: Client): Actions => {
    return {
      writeContract: (args) => {
        checkLock()
        return writeContract(client, args)
      },
      unlockAccount: (passphrase: string, duration: number) =>
        lock.unlock(account.address, passphrase, duration),
    }
  })
}

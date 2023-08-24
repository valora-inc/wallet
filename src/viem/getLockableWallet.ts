import Logger from 'src/utils/Logger'
import { KeychainLock } from 'src/web3/KeychainLock'
import { Address, Chain, Client, WalletActions, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { writeContract } from 'viem/actions'

export default function getLockableViemWallet(
  lock: KeychainLock,
  chain: Chain,
  privateKey: Address
) {
  Logger.debug('getLockableViemWallet', lock, chain, privateKey)
  const account = privateKeyToAccount(privateKey)
  Logger.debug('account', account)
  const checkLock = () => {
    if (!lock.isUnlocked(account.address)) {
      throw new Error('authentication needed: password or unlock')
    }
  }

  return createWalletClient({
    chain,
    transport: http(),
    account,
  }).extend(
    (
      client: Client
    ): {
      writeContract: WalletActions['writeContract']
      unlockAccount: (passphrase: string, duration: number) => Promise<boolean>
    } => {
      return {
        writeContract: (args) => {
          checkLock()
          return writeContract(client, args)
        },
        unlockAccount: (passphrase: string, duration: number) =>
          lock.unlock(account.address, passphrase, duration),
      }
    }
  )
}

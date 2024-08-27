import { Network } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { appViemTransports, viemTransports } from 'src/viem'
import { KeychainAccounts } from 'src/web3/KeychainAccounts'
import networkConfig from 'src/web3/networkConfig'
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
import { Prettify } from 'viem/chains'

const TAG = 'viem/getLockableWallet'

export function getTransport({ chain, useApp }: { chain: Chain; useApp?: boolean }): Transport {
  const result = Object.entries(networkConfig.viemChain).find(
    ([_, viemChain]) => chain === viemChain
  )
  if (!result) {
    throw new Error(`No network defined for viem chain ${chain}, cannot create wallet`)
  }
  if (useApp) {
    const appTransport = appViemTransports[result[0] as keyof typeof appViemTransports]
    if (!appTransport) {
      throw new Error(`No app transport defined for network ${result[0]}, cannot create wallet`)
    }
    return appTransport
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
> = WalletActions<chain, account> & {
  unlockAccount: (passphrase: string, duration: number) => Promise<boolean>
}

export default function getLockableViemWallet(
  accounts: KeychainAccounts,
  chain: Chain,
  address: Address,
  useAppTransport: boolean = false
): ViemWallet {
  Logger.debug(TAG, `Getting viem wallet for ${address} on ${chain.name}`)
  const account = accounts.getViemAccount(address)
  if (!account) {
    throw new Error(`Account ${address} not found in KeychainAccounts`)
  }

  return createWalletClient({
    chain,
    transport: getTransport({ chain, useApp: useAppTransport }),
    account,
  }).extend((client) => {
    return {
      unlockAccount: (passphrase: string, duration: number) =>
        accounts.unlock(account.address, passphrase, duration),
    }
  })
}

import { Address, Hex, isAddressEqual } from 'viem'
import { LocalAccount, PrivateKeyAccount, privateKeyToAccount, toAccount } from 'viem/accounts'

export interface ViemKeychainAccount extends LocalAccount<'keychain'> {
  unlock(privateKey: Hex): void
}

/**
 * Use our keychain accounts as viem accounts.
 * It is meant to be used with KeychainAccounts.
 */
export function keychainAccountToAccount({
  address,
  isUnlocked,
}: {
  address: Address
  isUnlocked: () => boolean
}): ViemKeychainAccount {
  let unlockedAccount: PrivateKeyAccount | null = null

  function getUnlockedAccount(): PrivateKeyAccount {
    if (!isUnlocked()) {
      unlockedAccount = null
    }
    if (!unlockedAccount) {
      throw new Error('authentication needed: password or unlock')
    }
    return unlockedAccount
  }

  const account = toAccount({
    address,
    async signMessage(...args) {
      return getUnlockedAccount().signMessage(...args)
    },
    async signTransaction(...args) {
      return getUnlockedAccount().signTransaction(...args)
    },
    async signTypedData(...args) {
      return getUnlockedAccount().signTypedData(...args)
    },
  })

  return {
    ...account,
    source: 'keychain',
    // This is meant to be called by KeychainAccounts
    unlock: (privateKey: Hex) => {
      const privateKeyAccount = privateKeyToAccount(privateKey)
      if (!isAddressEqual(privateKeyAccount.address, address)) {
        throw new Error(
          `Private key address (${privateKeyAccount.address}) does not match the expected account address (${address})`
        )
      }
      unlockedAccount = privateKeyAccount
    },
  }
}

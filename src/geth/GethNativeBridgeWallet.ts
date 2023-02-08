// import { CeloTx } from '@celo/connect'
// import {
//   ensureLeading0x,
//   normalizeAddressWith0x,
//   privateKeyToAddress,
// } from '@celo/utils/lib/address'
// import { EIP712TypedData } from '@celo/utils/lib/sign-typed-data-utils'
// import { UnlockableWallet } from '@celo/wallet-base'
// import { RemoteWallet } from '@celo/wallet-remote'
// import * as ethUtil from 'ethereumjs-util'
// import { GethNativeModule } from 'react-native-geth'
// import { ErrorMessages } from 'src/app/ErrorMessages'
// import { GethNativeBridgeSigner } from 'src/geth/GethNativeBridgeSigner'
// import Logger from 'src/utils/Logger'

// const TAG = 'geth/GethNativeBridgeWallet'

// export class GethNativeBridgeWallet
//   extends RemoteWallet<GethNativeBridgeSigner>
//   implements UnlockableWallet {
//   /**
//    * Construct a React Native geth wallet which uses the bridge methods
//    * instead of communicating with a node
//    * @param geth The instance of the bridge object
//    * @dev overrides WalletBase.signTransaction
//    */
//   constructor(private geth: GethNativeModule) {
//     super()
//   }

//   async loadAccountSigners(): Promise<Map<string, GethNativeBridgeSigner>> {
//     let accounts: string[]
//     const addressToSigner = new Map<string, GethNativeBridgeSigner>()

//     try {
//       accounts = await this.geth.listAccounts()
//     } catch (e) {
//       Logger.error(`${TAG}@loadAccountSigners`, 'Error listing accounts', e)
//       throw new Error(ErrorMessages.GETH_FETCH_ACCOUNTS)
//     }

//     accounts.forEach((address) => {
//       const cleanAddress = normalizeAddressWith0x(address)
//       addressToSigner.set(cleanAddress, new GethNativeBridgeSigner(this.geth, cleanAddress))
//     })
//     return addressToSigner
//   }

//   async addAccount(privateKey: string, passphrase: string): Promise<string> {
//     Logger.info(`${TAG}@addAccount`, `Adding a new account`)
//     const address = normalizeAddressWith0x(privateKeyToAddress(ensureLeading0x(privateKey)))
//     if (this.hasAccount(address)) {
//       throw new Error(ErrorMessages.GETH_ACCOUNT_ALREADY_EXISTS)
//     }
//     const signer = new GethNativeBridgeSigner(this.geth, address)
//     const resultantAddress = await signer.init(privateKey, passphrase)
//     if (normalizeAddressWith0x(resultantAddress) !== address) {
//       throw new Error(ErrorMessages.GETH_UNEXPECTED_ADDRESS_ON_ADD)
//     }
//     this.addSigner(resultantAddress, signer)
//     return resultantAddress
//   }
//   /**
//    * Updates the passphrase of an account
//    * @param account - the account to update
//    * @param oldPassphrase - the passphrase currently associated with the account
//    * @param newPassphrase - the new passphrase to use with the account
//    * @returns whether the update was successful
//    */
//   async updateAccount(account: string, oldPassphrase: string, newPassphrase: string) {
//     Logger.info(`${TAG}@updateAccount`, `Updating ${account}`)
//     return this.geth.updateAccount(account, oldPassphrase, newPassphrase)
//   }

//   /**
//    * Unlocks an account for a given duration
//    * @param account String the account to unlock
//    * @param passphrase String the passphrase of the account
//    * @param duration Number the duration of the unlock period
//    */
//   async unlockAccount(account: string, passphrase: string, duration: number) {
//     Logger.info(`${TAG}@unlockAccount`, `Unlocking ${account}`)
//     const signer = this.getSigner(account) as GethNativeBridgeSigner
//     return signer.unlock(passphrase, duration)
//   }

//   isAccountUnlocked(address: string) {
//     const signer = this.getSigner(address)
//     return signer.isUnlocked()
//   }

//   /**
//    * Gets the signer based on the 'from' field in the tx body
//    * @param txParams Transaction to sign
//    * @dev overrides WalletBase.signTransaction
//    */
//   async signTransaction(txParams: CeloTx) {
//     Logger.info(`${TAG}@signTransaction`, `Signing transaction: ${JSON.stringify(txParams)}`)
//     // Get the signer from the 'from' field
//     const fromAddress = txParams.from!.toString()
//     const signer = this.getSigner(fromAddress)
//     return signer.signRawTransaction(txParams)
//   }

//   /**
//    * Sign the provided typed data with the given address
//    * @param address The address with which to sign
//    * @param typedData The data to sign
//    * @dev overrides WalletBase.signTypedData
//    */
//   async signTypedData(address: string, typedData: EIP712TypedData): Promise<string> {
//     Logger.info(
//       `${TAG}@signTypedData`,
//       `Signing typed DATA: ${JSON.stringify({ address, typedData })}`
//     )
//     const signer = this.getSigner(address)
//     const { v, r, s } = await signer.signTypedData(typedData, address)
//     return ethUtil.toRpcSig(v, r, s)
//   }
// }

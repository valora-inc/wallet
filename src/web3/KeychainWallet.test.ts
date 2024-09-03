import { CeloTx, EncodedTransaction } from '@celo/connect'
import { recoverTransaction, verifyEIP712TypedDataSigner } from '@celo/wallet-base'
import CryptoJS from 'crypto-js'
import MockDate from 'mockdate'
import * as Keychain from 'react-native-keychain'
import { normalizeAddressWith0x, privateKeyToPublicKey, trimLeading0x } from 'src/utils/address'
import { Encrypt } from 'src/utils/ecies'
import { UNLOCK_DURATION } from 'src/web3/consts'
import { KeychainAccounts } from 'src/web3/KeychainAccounts'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import * as mockedKeychain from 'test/mockedKeychain'
import {
  mockAddress,
  mockAddress2,
  mockKeychainEncryptedPrivateKey,
  mockKeychainEncryptedPrivateKey2,
  mockPrivateKey,
  mockPrivateKey2,
} from 'test/values'
import { Address, verifyMessage } from 'viem'

// Use real encryption
jest.unmock('crypto-js')

const CHAIN_ID = 44378

const ONE_CELO_IN_WEI = '1000000000000000000'

// Sample data from the official EIP-712 example:
// https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
const TYPED_DATA = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ],
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
    Mail: [
      { name: 'from', type: 'Person' },
      { name: 'to', type: 'Person' },
      { name: 'contents', type: 'string' },
    ],
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
    },
    contents: 'Hello, Bob!',
  },
}

const FEE_ADDRESS = mockAddress
const CURRENCY_ADDRESS = mockAddress2

const UNKNOWN_ADDRESS = '0x1234567890123456789012345678901234567890'

const NULL_MNEMONIC_ACCOUNT = {
  address: null,
  createdAt: new Date(0),
}

const MOCK_DATE = new Date(1482363367071)

// This test suite was based on
// https://github.com/celo-org/celo-monorepo/blob/325b4e3ce10912478330cae6cf793aabfdb2816a/packages/sdk/wallets/wallet-local/src/local-wallet.test.ts
describe('KeychainWallet', () => {
  let wallet: KeychainWallet
  let accounts: KeychainAccounts

  beforeEach(async () => {
    jest.clearAllMocks()
    mockedKeychain.clearAllItems()
    accounts = new KeychainAccounts()
    wallet = new KeychainWallet(NULL_MNEMONIC_ACCOUNT, accounts)
    await wallet.init()
  })

  afterEach(() => {
    MockDate.reset()
  })

  it('starts with no accounts', () => {
    expect(wallet.getAccounts().length).toBe(0)
  })

  it('fails if you add an invalid private key', async () => {
    await expect(
      wallet.addAccount('this is not a valid private key', 'password')
    ).rejects.toThrowError('private key must be 32 bytes, hex or bigint, not string')
  })

  it('succeeds if you add a private key without 0x', async () => {
    await wallet.addAccount(mockPrivateKey, 'password')
    expect(wallet.hasAccount(mockAddress)).toBeTruthy()
  })

  it('succeeds if you add a private key with 0x', async () => {
    await wallet.addAccount(mockPrivateKey2, 'password2')
    expect(wallet.hasAccount(mockAddress2)).toBeTruthy()
  })

  it('persists added accounts in the keychain', async () => {
    MockDate.set(MOCK_DATE)
    await wallet.addAccount(mockPrivateKey, 'password')

    expect(mockedKeychain.getAllKeys()).toEqual([
      'account--2016-12-21T23:36:07.071Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb',
    ])
  })

  describe('with persisted accounts', () => {
    const knownAddress = mockAddress
    const otherAddress = mockAddress2

    beforeEach(async () => {
      // Setup mocked keychain content, intentionally ordering items in descending creation date
      // created using:
      // await wallet.addAccount(PRIVATE_KEY1, 'password')
      // await wallet.addAccount(PRIVATE_KEY2, 'password2')
      mockedKeychain.setItems({
        'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
          password: mockKeychainEncryptedPrivateKey2,
        },
        // This will be ignored
        'unrelated item': {
          password: 'unrelated password',
        },
        'account--2021-01-10T11:14:50.298Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb': {
          password: mockKeychainEncryptedPrivateKey,
        },
      })
      accounts = new KeychainAccounts()
      wallet = new KeychainWallet(NULL_MNEMONIC_ACCOUNT, accounts)
      await wallet.init()
    })

    it('lists all addresses sorted by creation date', () => {
      expect(wallet.getAccounts()).toMatchObject([mockAddress, mockAddress2])
    })

    it('fails to unlock using incorrect passwords', async () => {
      for (const incorrectPassword of ['incorrect', 'password2', '', ' ', '!']) {
        await expect(
          wallet.unlockAccount(knownAddress, incorrectPassword, UNLOCK_DURATION)
        ).resolves.toBe(false)
        expect(wallet.isAccountUnlocked(knownAddress)).toBe(false)
      }
    })

    it('can unlock indefinitely when the duration is 0', async () => {
      MockDate.set(MOCK_DATE)
      await expect(wallet.unlockAccount(knownAddress, 'password', 0)).resolves.toBe(true)
      expect(wallet.isAccountUnlocked(knownAddress)).toBe(true)
      MockDate.set(new Date(2100, 1, 1)) // Date in the far future
      expect(wallet.isAccountUnlocked(knownAddress)).toBe(true)
    })

    describe('update account password', () => {
      it('succeeds when providing the right password', async () => {
        await expect(wallet.updateAccount(knownAddress, 'password', 'newPassword')).resolves.toBe(
          true
        )

        // Check we cannot unlock using the old password
        await expect(wallet.unlockAccount(knownAddress, 'password', UNLOCK_DURATION)).resolves.toBe(
          false
        )
        // Check we can unlock using the new password
        await expect(
          wallet.unlockAccount(knownAddress, 'newPassword', UNLOCK_DURATION)
        ).resolves.toBe(true)
      })

      it('fails when providing a wrong password', async () => {
        await expect(
          wallet.updateAccount(knownAddress, 'incorrectPassword', 'newPassword')
        ).resolves.toBe(false)

        // Check we can unlock using the old password
        await expect(wallet.unlockAccount(knownAddress, 'password', UNLOCK_DURATION)).resolves.toBe(
          true
        )
        // Check we cannot unlock using the new password
        await expect(
          wallet.unlockAccount(knownAddress, 'newPassword', UNLOCK_DURATION)
        ).resolves.toBe(false)
      })
    })

    describe('when not unlocked', () => {
      it('fails calling signTransaction', async () => {
        const celoTransaction: CeloTx = {
          from: knownAddress,
          to: otherAddress,
          chainId: CHAIN_ID,
          value: ONE_CELO_IN_WEI,
          nonce: 0,
          gas: '10',
          gasPrice: '99',
          feeCurrency: '0x',
          gatewayFeeRecipient: FEE_ADDRESS,
          gatewayFee: '0x5678',
          data: '0xabcdef',
        }
        await expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError(
          'authentication needed: password or unlock'
        )
      })

      it('fails calling signPersonalMessage', async () => {
        const hexStr: string = '0xa1'
        await expect(wallet.signPersonalMessage(knownAddress, hexStr)).rejects.toThrowError(
          'authentication needed: password or unlock'
        )
      })

      it('fails calling signTypedData', async () => {
        await expect(wallet.signTypedData(knownAddress, TYPED_DATA)).rejects.toThrowError(
          'authentication needed: password or unlock'
        )
      })

      it('fails calling decrypt', async () => {
        await expect(wallet.decrypt(knownAddress, Buffer.from('anything'))).rejects.toThrowError(
          'authentication needed: password or unlock'
        )
      })

      it('fails calling computeSharedSecret', async () => {
        await expect(wallet.computeSharedSecret(knownAddress, mockAddress2)).rejects.toThrowError(
          'authentication needed: password or unlock'
        )
      })
    })

    describe('when unlocked', () => {
      beforeEach(async () => {
        MockDate.set(MOCK_DATE)
        await wallet.unlockAccount(knownAddress, 'password', UNLOCK_DURATION)
      })

      it('confirms it is unlocked', () => {
        expect(wallet.isAccountUnlocked(knownAddress)).toBeTruthy()
      })

      it('locks again after the duration', async () => {
        MockDate.set(MOCK_DATE.getTime() + UNLOCK_DURATION * 1000)
        expect(wallet.isAccountUnlocked(knownAddress)).toBeFalsy()
      })

      describe('signing', () => {
        describe('using an unknown address', () => {
          let celoTransaction: CeloTx

          beforeEach(() => {
            celoTransaction = {
              from: UNKNOWN_ADDRESS,
              to: UNKNOWN_ADDRESS,
              chainId: 2,
              value: ONE_CELO_IN_WEI,
              nonce: 0,
              gas: '10',
              gasPrice: '99',
              feeCurrency: CURRENCY_ADDRESS,
              gatewayFeeRecipient: FEE_ADDRESS,
              gatewayFee: '0x5678',
              data: '0xabcdef',
            }
          })

          it('fails calling signTransaction', async () => {
            await expect(wallet.signTransaction(celoTransaction)).rejects.toThrowError(
              `Could not find address ${UNKNOWN_ADDRESS}`
            )
          })

          it('fails calling signPersonalMessage', async () => {
            const hexStr: string = '0xa1'
            await expect(wallet.signPersonalMessage(UNKNOWN_ADDRESS, hexStr)).rejects.toThrowError(
              `Could not find address ${UNKNOWN_ADDRESS}`
            )
          })

          it('fails calling signTypedData', async () => {
            await expect(wallet.signTypedData(UNKNOWN_ADDRESS, TYPED_DATA)).rejects.toThrowError(
              `Could not find address ${UNKNOWN_ADDRESS}`
            )
          })
        })

        describe('using a known address', () => {
          describe('when calling signTransaction', () => {
            let celoTransaction: CeloTx

            beforeEach(() => {
              celoTransaction = {
                from: knownAddress,
                to: otherAddress,
                chainId: CHAIN_ID,
                value: ONE_CELO_IN_WEI,
                nonce: 0,
                gas: '10',
                gasPrice: '99',
                feeCurrency: '0x',
                gatewayFeeRecipient: FEE_ADDRESS,
                gatewayFee: '0x5678',
                data: '0xabcdef',
              }
            })

            it('succeeds', async () => {
              const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)

              // Check the signer is correct
              const [, recoveredSigner] = recoverTransaction(signedTx.raw)
              expect(normalizeAddressWith0x(recoveredSigner)).toBe(
                normalizeAddressWith0x(knownAddress)
              )
            })

            it('fails when trying to sign a tx with an invalid gas price', async () => {
              for (const gasPrice of [0, '0x0', '0x', '0', '']) {
                const testTx = { ...celoTransaction, gasPrice }
                await expect(wallet.signTransaction(testTx)).rejects.toThrowError(
                  /Preventing sign tx with 'gasPrice'/
                )
              }
            })
          })

          describe('when calling signPersonalMessage', () => {
            it('succeeds', async () => {
              const hexStr: string = mockAddress
              const signedMessage = await wallet.signPersonalMessage(knownAddress, hexStr)
              expect(signedMessage).not.toBeUndefined()
              // const valid = verifyMessage(hexStr, signedMessage, knownAddress)
              const valid = verifyMessage({
                address: knownAddress,
                message: hexStr,
                signature: signedMessage as Address,
              })
              expect(valid).toBeTruthy()
            })
          })

          describe('when calling signTypedData', () => {
            it('succeeds', async () => {
              const signedMessage = await wallet.signTypedData(knownAddress, TYPED_DATA)
              expect(signedMessage).not.toBeUndefined()
              const valid = verifyEIP712TypedDataSigner(TYPED_DATA, signedMessage, knownAddress)
              expect(valid).toBeTruthy()
            })
          })
        })
      })

      describe('decryption', () => {
        describe('using an unknown address', () => {
          it('fails calling decrypt', async () => {
            await expect(
              wallet.decrypt(UNKNOWN_ADDRESS, Buffer.from('anything'))
            ).rejects.toThrowError(`Could not find address ${UNKNOWN_ADDRESS}`)
          })
        })

        describe('using a known address', () => {
          it('properly decrypts the ciphertext', async () => {
            const publicKey = privateKeyToPublicKey(mockPrivateKey)
            const plaintext = 'test_plaintext'
            const ciphertext = Encrypt(
              Buffer.from(trimLeading0x(publicKey), 'hex'),
              Buffer.from(plaintext)
            )
            const decryptedPlaintext = await wallet.decrypt(mockAddress, ciphertext)
            expect(decryptedPlaintext.toString()).toEqual(plaintext)
          })
        })
      })
    })
  })

  // This ensures private keys which were stored without the 0x prefix are still supported
  describe('with a persisted account with a non normalized private key', () => {
    const knownAddress = mockAddress
    const otherAddress = mockAddress2

    beforeEach(async () => {
      // Setup mocked keychain content with a private key without the 0x prefix
      mockedKeychain.setItems({
        'account--2021-01-10T11:14:50.298Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb': {
          password: await CryptoJS.AES.encrypt(mockPrivateKey, 'password').toString(),
        },
      })

      wallet = new KeychainWallet(NULL_MNEMONIC_ACCOUNT, new KeychainAccounts())
      await wallet.init()
      await wallet.unlockAccount(knownAddress, 'password', 0)
    })

    it('can sign a transaction', async () => {
      const signedTx: EncodedTransaction = await wallet.signTransaction({
        from: knownAddress,
        to: otherAddress,
        chainId: CHAIN_ID,
        value: ONE_CELO_IN_WEI,
        nonce: 0,
        gas: '10',
        gasPrice: '99',
        feeCurrency: '0x',
        gatewayFeeRecipient: FEE_ADDRESS,
        gatewayFee: '0x5678',
        data: '0xabcdef',
      })

      // Check the signer is correct
      const [, recoveredSigner] = recoverTransaction(signedTx.raw)
      expect(normalizeAddressWith0x(recoveredSigner)).toBe(normalizeAddressWith0x(knownAddress))
    })
  })

  // This tests migration from a Geth KeyStore account
  describe('migration from an existing geth account', () => {
    // const ENGLISH_MNEMONIC =
    //   'there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband inner surprise invest'
    const KEYCHAIN_ENCRYPTED_MNEMONIC =
      'U2FsdGVkX1/GarslRKQ/3jzdu+tuwnlsSEtyPcIzHzqElP21cPnReaxy1lAdqQONxv8BWAnqSs/4MH7qCzP/Z4TbAwmtQAkPyLsNu00i5be+WlG9upOG/N+/RaeJHjS2TJ/qJ+YkgmEBG3juUCfUTVJFmsuxpUxY3N1hucQ9ba8qIdCy+ziuJFlpLTXZPqnEoUrlzWxC5JhMwTrf2i2iSRUYLpVMb4tDbljpM8uHxrqh7ElKMyuarYIMvF5EUIiy'
    // const ANOTHER_MNEMONIC =
    //   'invest there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband inner surprise'
    const KEYCHAIN_ENCRYPTED_ANOTHER_MNEMONIC =
      'U2FsdGVkX19InM66laG10l00IRRoIMzT90IwmRbEqOHL7HE/ZQSypxB/z9BTRfqXdoZR6g1S9YE59Scx2XopowHhi0grFYvrgQsWtX9kt5DCcGNPM7izATvXu74i18sMt/t5uedZnMxL54968Axt7Yw7Zcp5fjhT9iX8s798Q+dddGTeqJKINkn/A4UulDxo2IiXsALA4sSEeNuq5gsyH3MTy3WK/joDpglpy/8etsa6RN8Na8La9+ZI71TJq6BJ'
    const GETH_ACCOUNT_ADDRESS = '0x0be03211499a654f0c00d8148b074c5d574654e4'
    const EXISTING_GETH_ACCOUNT = {
      address: GETH_ACCOUNT_ADDRESS,
      createdAt: new Date(1482363367071),
    }

    describe('with an existing geth account whose private key is NOT yet stored in the keychain', () => {
      describe('when the matching mnemonic is in the keychain', () => {
        describe('when the geth account was created in the past', () => {
          beforeEach(async () => {
            // Setup mocked keychain content, created using:
            // await wallet.addAccount(PRIVATE_KEY2, 'password2')
            // await storeMnemonic(ENGLISH_MNEMONIC, GETH_ACCOUNT_ADDRESS, 'password')
            mockedKeychain.setItems({
              'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
                password: mockKeychainEncryptedPrivateKey2,
              },
              // This will be ignored
              'unrelated item': {
                password: 'unrelated password',
              },
              // Mnemonic for 0x0be03211499a654f0c00d8148b074c5d574654e4
              mnemonic: {
                password: KEYCHAIN_ENCRYPTED_MNEMONIC,
              },
            })
            accounts = new KeychainAccounts()
            wallet = new KeychainWallet(EXISTING_GETH_ACCOUNT, accounts)
            await wallet.init()
          })

          it('lists the existing geth account first', () => {
            expect(wallet.getAccounts()).toEqual([GETH_ACCOUNT_ADDRESS, mockAddress2])
          })

          it('imports the geth account private key from the mnemonic into the keychain on the first unlock', async () => {
            expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)
            await expect(
              wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
            ).resolves.toBe(true)

            expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1)

            expect(mockedKeychain.getAllKeys()).toEqual([
              'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0',
              'unrelated item',
              'mnemonic',
              'account--2016-12-21T23:36:07.071Z--0be03211499a654f0c00d8148b074c5d574654e4',
            ])

            // Unlock again
            await expect(
              wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
            ).resolves.toBe(true)

            // Check that the private key is not imported again
            expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1)
          })

          it('signs transactions successfully', async () => {
            const celoTransaction: CeloTx = {
              from: GETH_ACCOUNT_ADDRESS,
              to: mockAddress2,
              chainId: CHAIN_ID,
              value: ONE_CELO_IN_WEI,
              nonce: 0,
              gas: '10',
              gasPrice: '99',
              feeCurrency: '0x',
              gatewayFeeRecipient: FEE_ADDRESS,
              gatewayFee: '0x5678',
              data: '0xabcdef',
            }

            await expect(
              wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
            ).resolves.toBe(true)
            const signedTx: EncodedTransaction = await wallet.signTransaction(celoTransaction)

            // Check the signer is correct
            const [, recoveredSigner] = recoverTransaction(signedTx.raw)
            expect(normalizeAddressWith0x(recoveredSigner)).toBe(
              normalizeAddressWith0x(GETH_ACCOUNT_ADDRESS)
            )
          })
        })

        describe('when the geth account was created in the future', () => {
          beforeEach(async () => {
            // Set future date
            MockDate.set(new Date(2030, 1, 1))
            // Setup mocked keychain content, created using:
            // await wallet.addAccount(PRIVATE_KEY2, 'password2')
            // await storeMnemonic(ENGLISH_MNEMONIC, GETH_ACCOUNT_ADDRESS, 'password')
            mockedKeychain.setItems({
              'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
                password: mockKeychainEncryptedPrivateKey2,
              },
              // This will be ignored
              'unrelated item': {
                password: 'unrelated password',
              },
              // Mnemonic for 0x0be03211499a654f0c00d8148b074c5d574654e4
              mnemonic: {
                password: KEYCHAIN_ENCRYPTED_MNEMONIC,
              },
            })
            accounts = new KeychainAccounts()
            wallet = new KeychainWallet(
              {
                ...EXISTING_GETH_ACCOUNT,
                // Even further future date
                createdAt: new Date(2040, 5, 17),
              },
              accounts
            )
            await wallet.init()
          })

          it('lists the existing geth account first', () => {
            expect(wallet.getAccounts()).toEqual([GETH_ACCOUNT_ADDRESS, mockAddress2])
          })

          it('imports the geth account private key from the mnemonic into the keychain on the first unlock', async () => {
            expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)
            await expect(
              wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
            ).resolves.toBe(true)

            expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(1)

            expect(mockedKeychain.getAllKeys()).toEqual([
              'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0',
              'unrelated item',
              'mnemonic',
              // This is 1 ms before the other account
              'account--2022-05-25T11:14:50.291Z--0be03211499a654f0c00d8148b074c5d574654e4',
            ])
          })
        })
      })

      describe("when the mnemonic in the keychain doesn't match the account", () => {
        beforeEach(async () => {
          // Setup mocked keychain content, created using:
          // await wallet.addAccount(PRIVATE_KEY2, 'password2')
          // await storeMnemonic(ANOTHER_MNEMONIC, GETH_ACCOUNT_ADDRESS, 'password')
          mockedKeychain.setItems({
            'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
              password: mockKeychainEncryptedPrivateKey2,
            },
            // This will be ignored
            'unrelated item': {
              password: 'unrelated password',
            },
            // Another mnemonic
            mnemonic: {
              password: KEYCHAIN_ENCRYPTED_ANOTHER_MNEMONIC,
            },
          })
          accounts = new KeychainAccounts()
          wallet = new KeychainWallet(EXISTING_GETH_ACCOUNT, accounts)
          await wallet.init()
        })

        it('lists the existing geth account first', () => {
          expect(wallet.getAccounts()).toEqual([GETH_ACCOUNT_ADDRESS, mockAddress2])
        })

        it('fails to import the geth account private key from the mnemonic when unlocking', async () => {
          expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)
          await expect(
            wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
          ).rejects.toThrowError(
            'Generated private key address (0x652e61b1f42e37f0d101252161cbce07a0af30fa) does not match the existing account address (0x0be03211499a654f0c00d8148b074c5d574654e4)'
          )

          expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)

          expect(mockedKeychain.getAllKeys()).toEqual([
            'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0',
            'unrelated item',
            'mnemonic',
          ])
        })
      })

      describe('when the mnemonic is NOT in the keychain', () => {
        beforeEach(async () => {
          // Setup mocked keychain content, created using:
          // await wallet.addAccount(PRIVATE_KEY2, 'password2')
          mockedKeychain.setItems({
            'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
              password: mockKeychainEncryptedPrivateKey2,
            },
            // This will be ignored
            'unrelated item': {
              password: 'unrelated password',
            },
          })
          accounts = new KeychainAccounts()
          wallet = new KeychainWallet(EXISTING_GETH_ACCOUNT, accounts)
          await wallet.init()
        })

        it('lists the existing geth account first', () => {
          expect(wallet.getAccounts()).toEqual([GETH_ACCOUNT_ADDRESS, mockAddress2])
        })

        it('fails to import the geth account private key from the mnemonic when unlocking', async () => {
          expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)
          await expect(
            wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
          ).rejects.toThrowError('No mnemonic found in storage')

          expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)

          expect(mockedKeychain.getAllKeys()).toEqual([
            'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0',
            'unrelated item',
          ])
        })
      })
    })

    describe('with an existing geth account whose private key is already stored in the keychain', () => {
      beforeEach(async () => {
        // Setup mocked keychain content, created using:
        // await wallet.addAccount(PRIVATE_KEY2, 'password2')
        // await storeMnemonic(ENGLISH_MNEMONIC, GETH_ACCOUNT_ADDRESS, 'password')
        // await wallet.addAccount(GETH_ACCOUNT_ADDRESS, 'password')
        mockedKeychain.setItems({
          'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
            password: mockKeychainEncryptedPrivateKey2,
          },
          // This will be ignored
          'unrelated item': {
            password: 'unrelated password',
          },
          // Mnemonic for 0x0be03211499a654f0c00d8148b074c5d574654e4
          mnemonic: {
            password: KEYCHAIN_ENCRYPTED_MNEMONIC,
          },
          'account--2016-12-21T23:36:07.071Z--0be03211499a654f0c00d8148b074c5d574654e4': {
            password:
              'U2FsdGVkX19YfY4frblfqsNRCdYBYdPikW7ZVo6pz+L4GtcXqX/Tc0twYg6GRGdq5mCPQ26OgQ0V67rdf8+zORR8PcxoatGyaclbmqc8qQod1YwJ6hSjj7uDGug+rar9',
          },
        })
        accounts = new KeychainAccounts()
        wallet = new KeychainWallet(EXISTING_GETH_ACCOUNT, accounts)
        await wallet.init()
      })

      it('lists the existing geth account first', () => {
        expect(wallet.getAccounts()).toEqual([GETH_ACCOUNT_ADDRESS, mockAddress2])
      })

      it('directly reads the private key from the keychain when unlocking', async () => {
        await expect(
          wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
        ).resolves.toBe(true)

        expect(Keychain.setGenericPassword).toHaveBeenCalledTimes(0)
      })
    })
  })
})

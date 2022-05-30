import { CeloTx, EncodedTransaction } from '@celo/connect'
import {
  normalizeAddressWith0x,
  privateKeyToAddress,
  privateKeyToPublicKey,
  trimLeading0x,
} from '@celo/utils/lib/address'
import { Encrypt } from '@celo/utils/lib/ecies'
import { verifySignature } from '@celo/utils/lib/signatureUtils'
import { recoverTransaction, verifyEIP712TypedDataSigner } from '@celo/wallet-base'
import MockDate from 'mockdate'
import { UNLOCK_DURATION } from 'src/geth/consts'
import { KeychainWallet } from 'src/web3/KeychainWallet'
import * as mockedKeychain from 'test/mockedKeychain'

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

const PRIVATE_KEY1 = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const PUBLIC_KEY1 = privateKeyToPublicKey(PRIVATE_KEY1)
const ACCOUNT_ADDRESS1 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY1))
const PRIVATE_KEY2 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890fdeccc'
const ACCOUNT_ADDRESS2 = normalizeAddressWith0x(privateKeyToAddress(PRIVATE_KEY2))

const FEE_ADDRESS = ACCOUNT_ADDRESS1
const CURRENCY_ADDRESS = ACCOUNT_ADDRESS2

const UNKNOWN_ADDRESS = '0x1234567890123456789012345678901234567890'

const NULL_MNEMONIC_ACCOUNT = {
  address: null,
  createdAt: new Date(0),
}

// This test suite was based on
// https://github.com/celo-org/celo-monorepo/blob/325b4e3ce10912478330cae6cf793aabfdb2816a/packages/sdk/wallets/wallet-local/src/local-wallet.test.ts
describe('KeychainWallet', () => {
  let wallet: KeychainWallet

  beforeEach(async () => {
    mockedKeychain.clearAllItems()
    wallet = new KeychainWallet(NULL_MNEMONIC_ACCOUNT)
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
    ).rejects.toThrowError('private key length is invalid')
  })

  it('succeeds if you add a private key without 0x', async () => {
    await wallet.addAccount(PRIVATE_KEY1, 'password')
    expect(wallet.hasAccount(ACCOUNT_ADDRESS1)).toBeTruthy()
  })

  it('succeeds if you add a private key with 0x', async () => {
    await wallet.addAccount(PRIVATE_KEY2, 'password2')
    expect(wallet.hasAccount(ACCOUNT_ADDRESS2)).toBeTruthy()
  })

  it('persists added accounts in the keychain', async () => {
    MockDate.set(1482363367071)
    await wallet.addAccount(PRIVATE_KEY1, 'password')

    expect(mockedKeychain.getAllKeys()).toEqual([
      'account--2016-12-21T23:36:07.071Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb',
    ])
  })

  // This tests migration from a Geth KeyStore account
  describe('with an existing Geth account', () => {
    const ENGLISH_MNEMONIC =
      'there resist cinnamon water salmon spare thumb explain equip uniform control divorce mushroom head vote below setup marriage oval topic husband inner surprise invest'
    const GETH_ACCOUNT_ADDRESS = '0x0be03211499a654f0c00d8148b074c5d574654e4'
    const EXISTING_GETH_ACCOUNT = {
      address: GETH_ACCOUNT_ADDRESS,
      createdAt: new Date(0),
    }
    beforeEach(async () => {
      // Setup mocked keychain content
      // created using:
      // await wallet.addAccount(PRIVATE_KEY2, 'password2')
      // await storeMnemonic(ENGLISH_MNEMONIC, GETH_ACCOUNT_ADDRESS, 'password')
      mockedKeychain.setItems({
        'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
          password:
            'U2FsdGVkX18191f7q1dS0CCvSGNjJ9PkcBGKaf+u1LVpuoBw2xSJe17hLW8QRXyKCtwvMknW2uTeWUeMRSfg/O1UdsEwdhMPxzqtOUTwT9evQri80JMGBImihFXKDdgN',
        },
        // This will be ignored
        'unrelated item': {
          password: 'unrelated password',
        },
        mnemonic: {
          password:
            'U2FsdGVkX1/GarslRKQ/3jzdu+tuwnlsSEtyPcIzHzqElP21cPnReaxy1lAdqQONxv8BWAnqSs/4MH7qCzP/Z4TbAwmtQAkPyLsNu00i5be+WlG9upOG/N+/RaeJHjS2TJ/qJ+YkgmEBG3juUCfUTVJFmsuxpUxY3N1hucQ9ba8qIdCy+ziuJFlpLTXZPqnEoUrlzWxC5JhMwTrf2i2iSRUYLpVMb4tDbljpM8uHxrqh7ElKMyuarYIMvF5EUIiy',
        },
      })

      wallet = new KeychainWallet(EXISTING_GETH_ACCOUNT)
      await wallet.init()
    })

    it('can retrieve all addresses sorted by creation date', () => {
      expect(wallet.getAccounts()).toEqual([GETH_ACCOUNT_ADDRESS, ACCOUNT_ADDRESS2])
    })

    it('imports the geth account private key from the mnemonic into the keychain on the first unlock', async () => {
      await expect(
        wallet.unlockAccount(GETH_ACCOUNT_ADDRESS, 'password', UNLOCK_DURATION)
      ).resolves.toBe(true)

      expect(mockedKeychain.getAllKeys()).toEqual([
        'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0',
        'unrelated item',
        'mnemonic',
        'account--1970-01-01T00:00:00.000Z--0be03211499a654f0c00d8148b074c5d574654e4',
      ])
    })
  })

  describe('with persisted accounts', () => {
    const knownAddress = ACCOUNT_ADDRESS1
    const otherAddress = ACCOUNT_ADDRESS2

    beforeEach(async () => {
      // Setup mocked keychain content, intentionally ordering items in descending creation date
      // created using:
      // await wallet.addAccount(PRIVATE_KEY1, 'password')
      // await wallet.addAccount(PRIVATE_KEY2, 'password2')
      mockedKeychain.setItems({
        'account--2022-05-25T11:14:50.292Z--588e4b68193001e4d10928660ab4165b813717c0': {
          password:
            'U2FsdGVkX18191f7q1dS0CCvSGNjJ9PkcBGKaf+u1LVpuoBw2xSJe17hLW8QRXyKCtwvMknW2uTeWUeMRSfg/O1UdsEwdhMPxzqtOUTwT9evQri80JMGBImihFXKDdgN',
        },
        // This will be ignored
        'unrelated item': {
          password: 'unrelated password',
        },
        'account--2021-01-10T11:14:50.298Z--1be31a94361a391bbafb2a4ccd704f57dc04d4bb': {
          password:
            'U2FsdGVkX1+4Da/3VE98t6m9FNs+Q0fqJlckHnL2+XctJPyvhZY+b0TSAB9oGiAMNDow1bjA3NYyzA3aKhFhHwAySzPOArFI/RpPlArT2/IGZ/IxKtKzKnd1pa4+q4fx',
        },
      })

      wallet = new KeychainWallet(NULL_MNEMONIC_ACCOUNT)
      await wallet.init()
    })

    it('can retrieve all addresses sorted by creation date', () => {
      expect(wallet.getAccounts()).toMatchObject([ACCOUNT_ADDRESS1, ACCOUNT_ADDRESS2])
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
        await expect(
          wallet.computeSharedSecret(knownAddress, ACCOUNT_ADDRESS2)
        ).rejects.toThrowError('authentication needed: password or unlock')
      })
    })

    describe('when unlocked', () => {
      const mockDate = new Date(1482363367071)

      beforeEach(async () => {
        MockDate.set(mockDate)
        await wallet.unlockAccount(knownAddress, 'password', UNLOCK_DURATION)
      })

      it('confirms it is unlocked', () => {
        expect(wallet.isAccountUnlocked(knownAddress)).toBeTruthy()
      })

      it('locks again after the duration', async () => {
        MockDate.set(mockDate.getTime() + UNLOCK_DURATION * 1000)
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
              for (const gasPrice of ['0x0', '0x', '0', '']) {
                const testTx = { ...celoTransaction, gasPrice }
                await expect(wallet.signTransaction(testTx)).rejects.toThrowError(
                  /Preventing sign tx with 'gasPrice'/
                )
              }
            })
          })

          describe('when calling signPersonalMessage', () => {
            it('succeeds', async () => {
              const hexStr: string = ACCOUNT_ADDRESS1
              const signedMessage = await wallet.signPersonalMessage(knownAddress, hexStr)
              expect(signedMessage).not.toBeUndefined()
              const valid = verifySignature(hexStr, signedMessage, knownAddress)
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
            const plaintext = 'test_plaintext'
            const ciphertext = Encrypt(
              Buffer.from(trimLeading0x(PUBLIC_KEY1), 'hex'),
              Buffer.from(plaintext)
            )
            const decryptedPlaintext = await wallet.decrypt(ACCOUNT_ADDRESS1, ciphertext)
            expect(decryptedPlaintext.toString()).toEqual(plaintext)
          })
        })
      })
    })
  })
})

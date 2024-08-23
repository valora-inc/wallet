import { ViemKeychainAccount, keychainAccountToAccount } from 'src/viem/keychainAccountToAccount'
import { mockTypedData } from 'test/values'
import { Hex } from 'viem'
import { Address, privateKeyToAddress } from 'viem/accounts'

const PRIVATE_KEY1 = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
const ACCOUNT_ADDRESS1 = privateKeyToAddress(PRIVATE_KEY1).toLowerCase() as Address

describe(keychainAccountToAccount, () => {
  let viemAccount: ViemKeychainAccount
  const isUnlocked = jest.fn().mockReturnValue(false)

  beforeEach(() => {
    jest.clearAllMocks()
    viemAccount = keychainAccountToAccount({
      address: ACCOUNT_ADDRESS1,
      isUnlocked,
    })
  })

  for (const [method, action] of [
    ['signMessage', () => viemAccount.signMessage({ message: 'hello world' })],
    [
      'signTransaction',
      () =>
        viemAccount.signTransaction({
          to: '0x0000000000000000000000000000000000000000',
          value: BigInt(1),
          gasPrice: BigInt(2),
        }),
    ],
    ['signTypedData', () => viemAccount.signTypedData(mockTypedData)],
  ] as const) {
    describe('when not unlocked', () => {
      it(`throws an error when calling ${method}`, async () => {
        await expect(action()).rejects.toThrow('authentication needed: password or unlock')
      })
    })

    describe('when unlocked', () => {
      beforeEach(() => {
        viemAccount.unlock(PRIVATE_KEY1)
        isUnlocked.mockReturnValue(true)
      })

      it(`calls the underlying account's ${method}`, async () => {
        await expect(action()).resolves.toBeDefined()
      })
    })
  }

  describe('unlock', () => {
    it('throws if private key address does not match the account address', () => {
      expect(() => viemAccount.unlock(PRIVATE_KEY1.replace('a', 'b') as Hex)).toThrow(
        `Private key address (0x6eb87607F5C48CF769d43e92cF394655E9D6EFDA) does not match the expected account address (${ACCOUNT_ADDRESS1})`
      )
    })
  })
})

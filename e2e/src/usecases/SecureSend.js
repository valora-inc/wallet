import { E2E_WALLET_PRIVATE_KEY, E2E_WALLET_SINGLE_VERIFIED_MNEMONIC } from 'react-native-dotenv'
import { createWalletClient, encodeFunctionData, erc20Abi, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import {
  WALLET_MULTIPLE_VERIFIED_ADDRESS,
  WALLET_MULTIPLE_VERIFIED_PHONE_NUMBER,
  WALLET_SINGLE_VERIFIED_ADDRESS,
} from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  enterPinUiIfNecessary,
  quickOnboarding,
  scrollIntoView,
  waitForElementById,
} from '../utils/utils'

const AMOUNT_TO_SEND = '0.01'
const WALLET_FUNDING_MULTIPLIER = 2.2

/**
 * Fund a wallet, using some existing wallet.
 *
 * @param senderPrivateKey: private key for wallet with funds
 * @param recipientAddress: wallet to receive funds
 * @param stableToken: recognised token symbol (e.g. 'cUSD')
 * @param amountEther: amount in "ethers" (as opposed to wei)
 */
const fundWallet = async (senderPrivateKey, recipientAddress, stableToken, amountEther) => {
  const stableTokenSymbolToAddress = {
    cUSD: '0x765de816845861e75a25fca122bb6898b8b1282a',
  }
  const tokenAddress = stableTokenSymbolToAddress[stableToken]
  if (!tokenAddress) {
    throw new Error(`Unsupported token symbol passed to fundWallet: ${stableToken}`)
  }

  const account = privateKeyToAccount(senderPrivateKey)
  const senderAddress = account.address
  console.log(`Sending ${amountEther} ${stableToken} from ${senderAddress} to ${recipientAddress}`)
  const client = createWalletClient({
    account,
    chain: celo,
    transport: http(),
  }).extend(publicActions)

  const fundingAmount = BigInt(amountEther * 10 ** 18)
  const hash = await client.sendTransaction({
    to: tokenAddress,
    from: senderAddress,
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipientAddress, fundingAmount],
    }),
  })
  const receipt = await client.waitForTransactionReceipt({ hash })

  console.log('Funding TX receipt', receipt)
}

export default SecureSend = () => {
  describe('Secure send flow with phone number lookup', () => {
    beforeAll(async () => {
      // fund wallet for send
      await fundWallet(
        E2E_WALLET_PRIVATE_KEY,
        WALLET_SINGLE_VERIFIED_ADDRESS,
        'cUSD',
        `${AMOUNT_TO_SEND * WALLET_FUNDING_MULTIPLIER}`
      )
      await launchApp({ delete: true })
      await quickOnboarding({ mnemonic: E2E_WALLET_SINGLE_VERIFIED_MNEMONIC })
    })

    it('Send cUSD to phone number with multiple mappings', async () => {
      await waitForElementById('HomeAction-Send', { timeout: 30_000, tap: true })
      await waitForElementById('SendSelectRecipientSearchInput', {
        timeout: 3000,
        tap: true,
      })
      await element(by.id('SendSelectRecipientSearchInput')).replaceText(
        WALLET_MULTIPLE_VERIFIED_PHONE_NUMBER
      )
      await element(by.id('RecipientItem')).tap()

      await waitForElementById('SendOrInviteButton', { timeout: 30_000, tap: true })

      // Use the last digits of the account to confirm the sender.
      await waitForElementById('confirmAccountButton', { timeout: 30_000, tap: true })
      for (let index = 0; index < 4; index++) {
        const character = WALLET_MULTIPLE_VERIFIED_ADDRESS.charAt(
          WALLET_MULTIPLE_VERIFIED_ADDRESS.length - (4 - index)
        )
        await element(by.id(`SingleDigitInput/digit${index}`)).replaceText(character)
      }

      // Scroll to see submit button
      await scrollIntoView('Submit', 'KeyboardAwareScrollView', 50)
      await element(by.id('ConfirmAccountButton')).tap()

      // Select the currency
      await waitForElementById('SendEnterAmount/TokenSelect', {
        timeout: 30_000,
        tap: true,
      })
      await waitForElementById('cUSDSymbol', { timeout: 30_000, tap: true })

      // Enter the amount and review
      await element(by.id('SendEnterAmount/TokenAmountInput')).tap()
      await element(by.id('SendEnterAmount/TokenAmountInput')).replaceText(AMOUNT_TO_SEND)
      await element(by.id('SendEnterAmount/TokenAmountInput')).tapReturnKey()
      await element(by.id('SendEnterAmount/ReviewButton')).tap()

      // Confirm and input PIN if necessary.
      await element(by.id('ConfirmButton')).tap()
      await enterPinUiIfNecessary()

      // Return to home screen.
      await waitForElementById('HomeAction-Send', { timeout: 30_000 })
    })
  })
}

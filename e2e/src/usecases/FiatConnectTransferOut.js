import { reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, quickOnboarding, sleep, waitForElementId } from '../utils/utils'
import { ALFAJORES_FORNO_URL, SAMPLE_PRIVATE_KEY } from '../utils/consts'
import { newKit } from '@celo/contractkit'
import { generateKeys, generateMnemonic } from '@celo/utils/lib/account'

// const jestExpect = require('expect')

async function navigateToFiatExchangeScreen() {
  await reloadReactNative()
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await element(by.id('add-and-withdraw')).tap()
}

async function fundWallet(senderPrivateKey, recipientAddress, token, amountEth) {
  const kit = newKit(ALFAJORES_FORNO_URL)
  const { address: senderAddress } = kit.web3.eth.accounts.privateKeyToAccount(senderPrivateKey)
  kit.connection.addAccount(senderPrivateKey)
  console.log(`funding wallet ${recipientAddress} from ${kit.web3.defaultAccount}`)
  const tokenContract = await kit.contracts.getStableToken(token)
  const amountWei = kit.web3.utils.toWei(amountEth, 'ether')
  await tokenContract.transfer(recipientAddress, amountWei.toString()).send({ from: senderAddress })
}

// TODO return funds if test fails before crypto is sent? could do this by wrapping pre-transfer steps in a try/catch, then returning funds to test wallet in the "catch" block before re-throwing

export const fiatConnectNonKycTransferOut = () => {
  it('First time FiatConnect cash out', async () => {
    const cashOutAmount = 0.02
    const amountPlusGas = `${cashOutAmount + 0.005}`
    const token = 'cUSD'
    const mnemonic = await generateMnemonic()
    const { address: walletAddress } = await generateKeys(mnemonic)
    await quickOnboarding(mnemonic) // ends on home screen
    await fundWallet(SAMPLE_PRIVATE_KEY, walletAddress, token, amountPlusGas)

    await navigateToFiatExchangeScreen()

    // FiatExchange
    await waitFor(element(by.text('0.025 cUSD'))) // need a balance to withdraw
      .toBeVisible()
      .withTimeout(10000) // block time plus buffer, in case funding tx is still pending
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()

    // FiatExchangeCurrency
    await waitForElementId(`radio/${token}`)
    await element(by.id(`radio/${token}`)).tap()
    await element(by.text('Next')).tap()

    // FiatExchangeAmount
    await waitForElementId('FiatExchangeInput')
    await element(by.id('FiatExchangeInput')).replaceText(`${cashOutAmount}`)
    await element(by.id('FiatExchangeNextButton')).tap()

    // SelectProviderScreen
    await expect(element(by.text('Select Withdraw Method'))).toBeVisible()
    await waitForElementId('Exchanges') // once visible, the FC providers should have also loaded
    try {
      // expand dropdown for "Bank Account" providers section
      await element(by.id('Bank/section')).tap()
    } catch (error) {
      // expected when only one provider exists for "Bank" fiat account type
      await expect(element(by.id('Bank/singleprovider')))
    }
    await element(by.id('image-Test Provider')).tap()
    await enterPinUiIfNecessary()

    // LinkAccountScreen
    await expect(element(by.text('Set Up Bank Account'))).toBeVisible()
    await expect(element(by.id('descriptionText'))).toBeVisible()
    await element(by.id('continueButton')).tap()

    // FiatDetailsScreen
    // assumes AccountNumber quote schema
    await expect(element(by.text('Enter Bank Information'))).toBeVisible()
    await element(by.id('input-institutionName')).replaceText('My Bank Name')
    await element(by.id('input-accountNumber')).replaceText('1234567890')
    await element(by.id('submitButton')).tap()

    // ReviewScreen
    await expect(element(by.text('Review'))).toBeVisible()
    await element(by.id('submitButton')).tap()

    // TransferStatusScreen
    await waitFor(element(by.id('loadingTransferStatus'))).not.toBeVisible()
    await expect(element(by.text('Your funds are on their way!'))).toBeVisible()
    await expect(element(by.text('Continue'))).toBeVisible()
    await element(by.id('Continue')).tap()

    // WalletHome
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible() // proxy for reaching home screen, imitating NewAccountOnboarding e2e test
  })

  // TODO return user flow
}

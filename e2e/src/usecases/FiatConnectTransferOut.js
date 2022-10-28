import { enterPinUiIfNecessary, quickOnboarding, waitForElementId } from '../utils/utils'
import { ALFAJORES_FORNO_URL, SAMPLE_PRIVATE_KEY } from '../utils/consts'
import { newKit } from '@celo/contractkit'
import { generateKeys, generateMnemonic } from '@celo/utils/lib/account'

/**
 * From the home screen, navigate to the FiatExchange screen (add/withdraw)
 *
 * @return {{result: Error}}
 */
async function navigateToFiatExchangeScreen() {
  await waitForElementId('Hamburger')
  await element(by.id('Hamburger')).tap()
  await element(by.id('add-and-withdraw')).tap()
}

/**
 * Fund a wallet, using some existing wallet.
 *
 * @param senderPrivateKey: private key for wallet with funds
 * @param recipientAddress: wallet to receive funds
 * @param stableToken: ContractKit-recognized stable token
 * @param amountEther: amount in "ethers" (as opposed to wei)
 */
async function fundWallet(senderPrivateKey, recipientAddress, stableToken, amountEther) {
  const kit = newKit(ALFAJORES_FORNO_URL)
  const { address: senderAddress } = kit.web3.eth.accounts.privateKeyToAccount(senderPrivateKey)
  kit.connection.addAccount(senderPrivateKey)
  const tokenContract = await kit.contracts.getStableToken(stableToken)
  const amountWei = kit.web3.utils.toWei(amountEther, 'ether')
  await tokenContract.transfer(recipientAddress, amountWei.toString()).send({ from: senderAddress })
}

/**
 * Select the currency and amount for a transfer.
 *
 * Must begin on FiatExchangeCurrency screen. Ends on SelectProviderScreen or ReviewScreen,
 *  depending on whether the user has transferred out with a FiatConnect provider before.
 *
 * @return {{result: Error}}
 */
async function selectCurrencyAndAmount(token, amount) {
  // FiatExchangeCurrency
  await waitForElementId(`radio/${token}`)
  await element(by.id(`radio/${token}`)).tap()
  await element(by.text('Next')).tap()

  // FiatExchangeAmount
  await waitForElementId('FiatExchangeInput')
  await element(by.id('FiatExchangeInput')).replaceText(`${amount}`)
  await element(by.id('FiatExchangeNextButton')).tap()
}

/**
 * Submit a transfer from the review screen.
 *
 * Must begin at FiatConnect ReviewScreen. Expects success status screen,
 *  continues past it and ends at home screen.
 *
 * @return {{result: Error}}
 */
async function submitTransfer() {
  // ReviewScreen
  await waitForElementId('submitButton')
  await element(by.id('submitButton')).tap()

  // TransferStatusScreen
  await waitFor(element(by.id('loadingTransferStatus'))).not.toBeVisible()
  await waitFor(element(by.text('Your funds are on their way!'))).toBeVisible()
  await waitForElementId('Continue')
  await element(by.id('Continue')).tap()

  // WalletHome
  await expect(element(by.id('SendOrRequestBar'))).toBeVisible() // proxy for reaching home screen, imitating NewAccountOnboarding e2e test
}

export const fiatConnectNonKycTransferOut = () => {
  it('FiatConnect cash out', async () => {
    // ******** First time experience ************
    const cashOutAmount = 0.02
    const gasAmount = 0.005
    const fundingAmount = `${2 * cashOutAmount + gasAmount}`
    const token = 'cUSD'
    const mnemonic = await generateMnemonic()
    const { address: walletAddress } = await generateKeys(mnemonic)
    await quickOnboarding(mnemonic) // ends on home screen
    await fundWallet(SAMPLE_PRIVATE_KEY, walletAddress, token, fundingAmount)
    await navigateToFiatExchangeScreen()

    // FiatExchange
    await waitFor(element(by.text(`${fundingAmount} cUSD`))) // need a balance to withdraw
      .toBeVisible()
      .withTimeout(20000) // in case funding tx is still pending. balance must be updated before amount can be selected.
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()

    await selectCurrencyAndAmount(token, cashOutAmount)

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

    await submitTransfer()

    // ******** Returning user experience ************
    await navigateToFiatExchangeScreen()
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()

    await selectCurrencyAndAmount(token, cashOutAmount)

    await submitTransfer()
  })
}

export const fiatConnectKycTransferOut = () => {
  it('FiatConnect cash out', async () => {
    // ******** First time experience ************
    const cashOutAmount = 0.01
    //const gasAmount = 0.005
    //const fundingAmount = '15.67'//`${2 * cashOutAmount + gasAmount}`
    const token = 'cUSD'
    const mnemonic =
      'rather birth regret pioneer wonder what usage company grab please road very kitten inject heavy coil stone oven weapon purpose weekend over unfold give' //await generateMnemonic()
    const { address: walletAddress } = await generateKeys(mnemonic)

    await quickOnboarding(mnemonic) // ends on home screen
    //await fundWallet(SAMPLE_PRIVATE_KEY, walletAddress, token, fundingAmount)
    await navigateToFiatExchangeScreen()

    // FiatExchange
    /*await waitFor(element(by.text(`${fundingAmount} cUSD`))) // need a balance to withdraw
      .toBeVisible()
      .withTimeout(20000)*/ // in case funding tx is still pending. balance must be updated before amount can be selected.
    await waitForElementId('cashOut')
    await element(by.id('cashOut')).tap()

    await selectCurrencyAndAmount(token, cashOutAmount)

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

    // KycLanding
    await expect(element(by.text('Verify your Identity'))).toBeVisible()
    await expect(element(by.id('step-one-grey'))).not.toBeVisible()
    await expect(element(by.id('checkbox'))).toBeVisible()
    await element(by.id('checkbox')).tap()
    await element(by.id('PersonaButton')).tap()

    // Persona Inquiry
    await waitFor(element(by.text('Begin verifying')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.text('Begin verifying')).tap()
    await expect(element(by.text('Select'))).toBeVisible()
    await element(by.text('Select')).tap()
    await expect(element(by.text('Driver License'))).toBeVisible()
    await element(by.text('Driver License')).tap()
    await expect(element(by.text('Enable camera'))).toBeVisible()
    await element(by.text('Enable camera')).tap()
  })
}

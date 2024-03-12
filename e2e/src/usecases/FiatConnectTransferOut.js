import { generateKeys, generateMnemonic } from '@celo/cryptographic-utils'
import { KycStatus } from '@fiatconnect/fiatconnect-types'
import fetch from 'node-fetch'
import { MOCK_PROVIDER_API_KEY, MOCK_PROVIDER_BASE_URL } from 'react-native-dotenv'
import { SAMPLE_PRIVATE_KEY } from '../utils/consts'
import {
  enterPinUiIfNecessary,
  fundWallet,
  quickOnboarding,
  sleep,
  waitForElementId,
} from '../utils/utils'

/**
 * From the home screen, navigate to the FiatExchange screen (add/withdraw)
 *
 * @return {{result: Error}}
 */
async function navigateToFiatExchangeScreen() {
  await waitForElementId('HomeActionsCarousel')
  await element(by.id('HomeActionsCarousel')).scrollTo('right')
  await waitForElementId('HomeAction-Withdraw')
  await element(by.id('HomeAction-Withdraw')).tap()
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
  await waitForElementId(`${token}Symbol`)
  await element(by.id(`${token}Symbol`)).tap()

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
async function submitTransfer(expectZeroBalance = false) {
  // ReviewScreen
  await waitForElementId('submitButton')
  await element(by.id('submitButton')).tap()

  // TransferStatusScreen
  await waitFor(element(by.id('loadingTransferStatus'))).not.toBeVisible()
  await waitFor(element(by.text('Your funds are on their way!'))).toBeVisible()
  await waitForElementId('Continue')
  await element(by.id('Continue')).tap()

  // WalletHome
  if (expectZeroBalance) {
  }
  await expect(element(by.id('HomeAction-Send'))).toBeVisible() // proxy for reaching home screen, imitating NewAccountOnboarding e2e test
}

/**
 * Set the kycStatus for a wallet address on the mock provider.
 *
 * @param kycStatus: the kycStatus string
 * @param walletAddress: the address string for which the kycStatus should be set
 */
async function setWalletKycStatus(kycStatus, walletAddress) {
  const requestOptions = {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MOCK_PROVIDER_API_KEY}`,
    },
    body: JSON.stringify({ kycStatus, walletAddress }),
  }
  const url = new URL('/kyc/PersonalDataAndDocuments/status', MOCK_PROVIDER_BASE_URL)
  const resp = await fetch(url, requestOptions)
  if (!resp.ok) {
    throw Error(`Unable to update kyc status of wallet ${walletAddress} to status ${kycStatus}`)
  }
}

/**
 * From a newly installed app, setup and start a transfer out.
 *
 * Onboards a new wallet and funds it before beginning a transfer out
 *  with the mock FiatConnect provider.
 *
 * @param token: string of the token that gets funded to the wallet
 * @param fundingAmount: token amount to be deposited
 * @param cashOutAmount: token amount to be transfered out (doesn't include gas)
 * @returns the address of the now-funded wallet
 */
async function onboardAndBeginTransferOut(token, fundingAmount, cashOutAmount) {
  const mnemonic = await generateMnemonic()
  const { address: walletAddress } = await generateKeys(mnemonic)
  await quickOnboarding(mnemonic) // ends on home screen
  await fundWallet(SAMPLE_PRIVATE_KEY, walletAddress, token, fundingAmount)
  // For now the balance only updates when the home screen is visible
  await waitFor(element(by.text(`${fundingAmount} cUSD`))) // need a balance to withdraw
    .toBeVisible()
    .withTimeout(60000) // in case funding tx is still pending. balance must be updated before amount can be selected.

  await navigateToFiatExchangeScreen()

  // FiatExchange
  await waitForElementId('cashOut')
  await element(by.id('cashOut')).tap()

  await selectCurrencyAndAmount(token, cashOutAmount)

  // SelectProviderScreen
  await expect(element(by.text('Select Withdraw Method'))).toBeVisible()
  await waitForElementId('Exchanges') // once visible, the FC providers should have also loaded
  try {
    // expand dropdown for "Bank Account" providers section
    await element(by.id('Bank/section')).tap()
    await element(by.id('image-Test Provider').withAncestor(by.id('Bank/providerList'))).tap()
  } catch (error) {
    // expected when only one provider exists for "Bank" fiat account type
    await expect(element(by.id('Bank/singleprovider')))
    await element(by.id('image-Test Provider').withAncestor(by.id('Bank/singleProviderInfo'))).tap()
  }
  await enterPinUiIfNecessary()

  return walletAddress
}

/**
 * From the FiatDetailsScreen, enter bank information and submit
 *
 * Currently assumes that the AccountNumber schema is used
 *
 * @return {{result: Error}}
 */
async function enterAccountInformation() {
  await expect(element(by.text('Enter Bank Information'))).toBeVisible()
  await element(by.id('input-institutionName')).replaceText('My Bank Name')
  await element(by.id('input-accountNumber')).replaceText('1234567890')
  await element(by.id('submitButton')).tap()
}

/**
 * From the home screen, navigate to FiatExchange and transfer out.
 *
 * @param token: string of the token that will be transferred out
 * @param cashOutAmount: token amount to withdraw
 */
async function returnUserTransferOut(token, cashOutAmount) {
  await navigateToFiatExchangeScreen()
  await waitForElementId('cashOut')
  await element(by.id('cashOut')).tap()

  await selectCurrencyAndAmount(token, cashOutAmount)

  await submitTransfer(true)
}

export const fiatConnectNonKycTransferOut = () => {
  it('FiatConnect cash out', async () => {
    // ******** First time experience ************
    const cashOutAmount = 0.02
    const gasAmount = 0.015
    const fundingAmount = `${2 * cashOutAmount + gasAmount}`
    const token = 'cUSD'
    await onboardAndBeginTransferOut(token, fundingAmount, cashOutAmount)

    // LinkAccountScreen
    await expect(element(by.text('Set Up Bank Account'))).toBeVisible()
    await expect(element(by.id('descriptionText'))).toBeVisible()
    await element(by.id('continueButton')).tap()

    // FiatDetailsScreen
    await enterAccountInformation()

    await submitTransfer()

    // ******** Returning user experience ************
    await returnUserTransferOut(token, cashOutAmount)
  })
}

export const fiatConnectKycTransferOut = () => {
  it('FiatConnect cash out', async () => {
    // ******** First time experience ************
    const cashOutAmount = 0.01
    const gasAmount = 0.015
    const fundingAmount = `${2 * cashOutAmount + gasAmount}`
    const token = 'cUSD'
    const walletAddress = await onboardAndBeginTransferOut(token, fundingAmount, cashOutAmount)

    // KycLanding

    // Step 1
    await expect(element(by.text('Verify your Identity'))).toBeVisible()
    await expect(element(by.id('step-one-grey'))).not.toBeVisible()
    await expect(element(by.id('step-two-grey'))).toBeVisible(25) // should be at least 25% visible default is 75%
    await expect(element(by.id('checkbox/unchecked'))).toBeVisible()
    await element(by.id('checkbox/unchecked')).tap()
    await element(by.id('PersonaButton')).tap()

    // Persona
    await waitFor(element(by.text('Begin verifying')))
      .toBeVisible()
      .withTimeout(5000)
    await element(by.text('Begin verifying')).tap()

    // Country of govt id screen
    await waitFor(element(by.text('Select')))
      .toBeVisible()
      .withTimeout(5 * 1000)
    await element(by.text('Select')).tap()

    // Id select screen
    await waitFor(element(by.text('Driver License')))
      .toBeVisible()
      .withTimeout(5 * 1000)
    await element(by.text('Driver License')).tap()
    await waitFor(element(by.text('Enable camera')))
      .toBeVisible()
      .withTimeout(5 * 1000)
    await element(by.text('Enable camera')).tap()

    // Manually wait for Take Photo button to appear, withTimeout didn't work
    await sleep(10000)

    // License photo front
    await element(by.label('Take photo')).tap()
    await element(by.text('Use this photo')).tap()

    // Manually wait for Take Photo button to appear, withTimeout didn't work
    await sleep(10000)

    // License photo back
    await element(by.label('Take photo')).tap()
    await element(by.text('Use this photo')).tap()

    // Manually wait for Take Photo button to appear, withTimeout didn't work
    await sleep(10000)

    // License photo barcode
    await element(by.label('Take photo')).tap()
    await element(by.text('Use this photo')).tap()

    // Selfie section
    await waitFor(element(by.text('Get started')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.text('Get started')).tap()
    await element(by.label('shutter button')).tap()
    await element(by.label('shutter button')).tap()
    await element(by.label('shutter button')).tap()

    // Name, number, email, address form
    await waitFor(element(by.text('Phone Number')))
      .toBeVisible()
      .withTimeout(10000)

    await element(by.type('PersonaPhoneNumberKit2.PhoneNumberTextField')).typeText('0123456789')
    await element(by.text('Phone Number')).tap() // Tap away to unfocus from input to dismiss keyboard
    await element(by.type('UITextField').withDescendant(by.label('Email Address'))).typeText(
      'test@example.com'
    )
    await element(by.text('Phone Number')).tap() // Tap away to unfocus from input

    // Scroll down to continue button - all params needed to scroll down on persona template
    // Last parameter is the start point of the scroll, 0.5 is the middle of the element
    await element(by.type('UIScrollView').withDescendant(by.text('Phone Number'))).scroll(
      400,
      'down',
      NaN,
      0
    )

    await element(by.text('Continue')).tap()

    // Somehow this sleep is needed to make the test pass
    // waitFor doesn't work here !?
    await sleep(1000)
    await element(by.text('Done')).tap() // End of Persona flow

    // Check that Mock Provider info is defined
    await setWalletKycStatus(KycStatus.KycApproved, walletAddress)

    // Step 2
    await waitFor(element(by.text('Set Up Bank Account')))
      .toBeVisible()
      .withTimeout(15000)
    await expect(element(by.id('step-one-grey'))).toBeVisible()
    await expect(element(by.id('step-two-grey'))).not.toBeVisible()
    await element(by.type('UIScrollView')).atIndex(0).scroll(400, 'down', NaN, 0.5)
    await element(by.id('continueButton')).tap()

    // FiatDetailsScreen
    await enterAccountInformation()

    await submitTransfer()

    // ******** Returning user experience ************
    await returnUserTransferOut(token, cashOutAmount)
  })
}

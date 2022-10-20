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
    await waitForElementId('submitButton')
    await element(by.id('submitButton')).tap()

    // TransferStatusScreen
    await waitFor(element(by.id('loadingTransferStatus'))).not.toBeVisible()
    await waitFor(element(by.text('Your funds are on their way!'))).toBeVisible()
    await expect(element(by.id('Continue'))).toBeVisible()
    await element(by.id('Continue')).tap()

    // WalletHome
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible() // proxy for reaching home screen, imitating NewAccountOnboarding e2e test

    // ******** Returning user experience ************
    await navigateToFiatExchangeScreen()
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

    // ReviewScreen
    await waitForElementId('submitButton')
    await element(by.id('submitButton')).tap()

    // TransferStatusScreen
    await waitFor(element(by.id('loadingTransferStatus'))).not.toBeVisible()
    await waitFor(element(by.text('Your funds are on their way!'))).toBeVisible()
    await expect(element(by.id('Continue'))).toBeVisible()
    await element(by.id('Continue')).tap()

    // WalletHome
    await expect(element(by.id('SendOrRequestBar'))).toBeVisible() // proxy for reaching home screen, imitating NewAccountOnboarding e2e test
  })
}

import { DEFAULT_PIN, EXAMPLE_NAME, SAMPLE_BACKUP_KEY } from './consts'

/**
 * Wait for an element to be visible for at least set amount of time
 * @param {string} elementId testID of the element to wait for
 * @param {number} timeout timeout in milliseconds
 */
export async function waitForElementById(
  elementId: string,
  timeout: number = 30_000
): Promise<void> {
  try {
    await waitFor(element(by.id(elementId)))
      .toBeVisible()
      .withTimeout(timeout)
  } catch {
    throw new Error(`Element with testID '${elementId}' not found`)
  }
}

/**
 * Wait for an element to be visible and then tap it
 * @param {string} elementId testID of the element to wait for
 * @param {number} timeout timeout in milliseconds
 * @param {number} index index of the element to tap
 */
export async function waitForElementByIdAndTap(
  elementId: string,
  timeout: number = 30_000,
  index: number = 0
): Promise<void> {
  await waitForElementById(elementId, timeout)
  index === 0
    ? await element(by.id(elementId)).tap()
    : await element(by.id(elementId)).atIndex(index).tap()
}

/**
 * Pause test execution for a set amount of time
 * @param {number} ms time in milliseconds to pause
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Enter a pin on the pin or confirm a pin
 * @param {string} pin pin to enter
 */
export async function enterPinUi(pin: string = DEFAULT_PIN): Promise<void> {
  try {
    await device.disableSynchronization()
    await sleep(250)
    for (const digit of pin) {
      try {
        if (device.getPlatform() === 'ios') {
          await element(by.id(`digit${digit}`))
            .atIndex(1)
            .tap()
        } else {
          await element(by.id(`digit${digit}`))
            .atIndex(0)
            .tap()
        }
      } catch {
        await element(by.id(`digit${digit}`)).tap()
      }
    }
  } catch {
    console.warn('Error entering Pin')
  } finally {
    await device.enableSynchronization()
  }
}

/**
 * Attempt to onboard a wallet with a mnemonic
 * @param {string} mnemonic mnemonic to use for onboarding
 * @returns {Promise<void>}
 */
export async function quickOnboarding(mnemonic: string = SAMPLE_BACKUP_KEY): Promise<void> {
  try {
    // Tap Restore Account
    await waitForElementByIdAndTap('RestoreAccountButton')

    // Accept Terms - if present
    try {
      await waitForElementById('scrollView')
      await element(by.id('scrollView')).scrollTo('bottom')
      await waitForElementByIdAndTap('AcceptTermsButton')
    } catch {}

    // Name and Picture
    await waitForElementById('NameEntry')
    await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
    await waitForElementByIdAndTap('NameAndPictureContinueButton')

    // Set pin
    await enterPinUi()
    // Verify pin
    await enterPinUi()

    // Restore existing wallet
    await waitFor(element(by.id('connectingToCelo')))
      .not.toBeVisible()
      .withTimeout(20000)

    // Input Wallet Backup Key
    await sleep(3000)
    await waitForElementByIdAndTap('ImportWalletBackupKeyInputField')
    await element(by.id('ImportWalletBackupKeyInputField')).replaceText(mnemonic)
    if (device.getPlatform() === 'ios') {
      // On iOS, type one more space to workaround onChangeText not being triggered with replaceText above
      // and leaving the restore button disabled
      await element(by.id('ImportWalletBackupKeyInputField')).typeText('\n')
    } else if (device.getPlatform() === 'android') {
      // Press back button to close the keyboard
      await device.pressBack()
    }

    await waitForElementByIdAndTap('ImportWalletButton')

    try {
      // case where account not funded yet. continue with onboarding.
      await waitForElementByIdAndTap('ConfirmUseAccountDialog/PrimaryAction')
    } catch {}

    // this onboarding step is bypassed for already verified wallets
    try {
      // Verify Education
      await waitForElementById('PhoneVerificationSkipHeader')
      // Skip
      await waitForElementByIdAndTap('PhoneVerificationSkipHeader')
    } catch {
      console.log(
        'Error trying to skip phone verification step during onboarding, likely due to wallet already being verified'
      )
    }

    // Assert on Wallet Home Screen
    await dismissCashInBottomSheet()
    await waitForElementById('HomeAction-Send')
  } catch (error) {
    console.log('Error during quick onboarding', error)
  } // Don't throw an error just silently continue
}

/**
 * Dismiss the Cash In bottom sheet if it is present
 * @returns {Promise<void>}
 */
export async function dismissCashInBottomSheet(): Promise<void> {
  try {
    await waitForElementById('CashInBottomSheet')
    await waitForElementByIdAndTap('DismissBottomSheet')
  } catch {}
}

/**
 * Enter a number on the custom number keypad component
 * @param {string} amount
 */
export async function inputNumberKeypad(amount: string): Promise<void> {
  for (const digit of amount) {
    await waitForElementByIdAndTap(`digit${digit}`)
  }
}

/**
 * Add a comment to a send transaction
 * @param {string} comment
 */
export async function addComment(comment: string): Promise<void> {
  await waitForElementById('commentInput/send')
  await element(by.id('commentInput/send')).replaceText('')
  await element(by.id('commentInput/send')).replaceText(`${comment}\n`)
  await element(by.id('commentInput/send')).tapReturnKey()
  if (device.getPlatform() === 'android') {
    // Workaround keyboard remaining open on Android (tapReturnKey doesn't work there and just adds a new line)
    // so we tap something else in the scrollview to hide the soft keyboard
    await waitForElementByIdAndTap('HeaderText')
  }
}

/**
 * Enter the PIN if the PIN prompt is visible
 * @returns {Promise<void>}
 */
export async function enterPinIfNecessary(): Promise<void> {
  if (await isTextVisible('Enter PIN')) {
    await enterPinUi()
  }
}

/**
 * Check if a text is visible on the screen
 * @param {string} text the text to check visibility of
 * @returns {Promise<boolean>}
 */
export async function isTextVisible(text: string): Promise<boolean> {
  try {
    await expect(element(by.text(text))).toBeVisible()
    return true
  } catch {
    return false
  }
}

export async function waitForElementByText(
  text: string,
  timeout: number = 30_000,
  index: number = 0
): Promise<void> {
  try {
    index === 0
      ? await waitFor(element(by.text(text)))
      : await waitFor(element(by.text(text)).atIndex(index))
          .toBeVisible()
          .withTimeout(timeout)
  } catch {
    throw new Error(`Element with text '${text}' not found`)
  }
}

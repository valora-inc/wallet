import { E2E_WALLET_MNEMONIC } from 'react-native-dotenv'
import { sleep } from '../../../src/utils/sleep'
import { DEFAULT_PIN } from '../utils/consts'

export class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export async function enterPinUi(pin = DEFAULT_PIN) {
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

async function isTextPresent(text) {
  try {
    await expect(element(by.text(text))).toExist()
    return true
  } catch {
    return false
  }
}

export async function enterPinUiIfNecessary() {
  if (await isTextPresent('Enter PIN')) {
    await enterPinUi()
  }
}

export async function isElementVisible(elementId, index) {
  try {
    if (index === undefined) {
      await expect(element(by.id(elementId))).toBeVisible()
      return true
    } else {
      await expect(element(by.id(elementId)).atIndex(index)).toBeVisible()
      return true
    }
  } catch (e) {
    return false
  }
}

export async function waitForElementById(testID, { timeout = 10000, index = 0, tap = false } = {}) {
  try {
    const elementMatcher =
      index === 0 ? element(by.id(testID)) : element(by.id(testID)).atIndex(index)

    await waitFor(elementMatcher).toBeVisible().withTimeout(timeout)

    if (tap) {
      index === 0
        ? await element(by.id(testID)).tap()
        : await element(by.id(testID)).atIndex(index).tap()
    }
  } catch {
    throw new Error(`Element with testID '${testID}' not found`)
  }
}

export async function quickOnboarding({
  mnemonic = E2E_WALLET_MNEMONIC,
  cloudBackupEnabled = false,
} = {}) {
  try {
    // Tap Restore Account
    await element(by.id('RestoreAccountButton')).tap()

    // Accept Terms - if present
    try {
      await element(by.id('scrollView')).scrollTo('bottom')
      await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
      await element(by.id('AcceptTermsButton')).tap()
    } catch {}

    // Set pin
    await enterPinUi()
    // Verify pin
    await enterPinUi()

    if (cloudBackupEnabled) {
      await waitFor(element(by.text('From recovery phrase')))
        .toBeVisible()
        .withTimeout(10000)
      await element(by.text('From recovery phrase')).tap()
    }

    // Restore existing wallet
    await waitFor(element(by.id('connectingToCelo')))
      .not.toBeVisible()
      .withTimeout(20000)

    // Input Wallet Backup Key
    await waitForElementById('ImportWalletBackupKeyInputField', {
      tap: true,
    })

    await element(by.id('ImportWalletBackupKeyInputField')).replaceText(mnemonic)
    if (device.getPlatform() === 'ios') {
      // On iOS, type one more space to workaround onChangeText not being triggered with replaceText above
      // and leaving the restore button disabled
      await element(by.id('ImportWalletBackupKeyInputField')).typeText('\n')
    } else if (device.getPlatform() === 'android') {
      // Press back button to close the keyboard
      await device.pressBack()
    }

    await scrollIntoView('Restore', 'ImportWalletKeyboardAwareScrollView')
    await waitForElementById('ImportWalletButton', {
      tap: true,
    })
    // Wait for the wallet to restored
    await sleep(5 * 1000)

    try {
      // case where account not funded yet. continue with onboarding.
      await waitForElementById('ConfirmUseAccountDialog/PrimaryAction', {
        tap: true,
      })
    } catch {}

    // this onboarding step is bypassed for already verified wallets
    try {
      // Skip Phone Verification
      await waitForElementById('PhoneVerificationSkipHeader', {
        tap: true,
      })
    } catch {
      console.log(
        'Error trying to skip phone verification step during onboarding, likely due to wallet already being verified'
      )
    }

    // Assert on Wallet Home Screen
    await expect(element(by.id('HomeAction-Send'))).toBeVisible()
  } catch {} // Don't throw an error just silently continue
}

/**
 * Scrolls to an element within another
 * @param {string} scrollTo - The element to scroll to by text.
 * @param {string} scrollIn - The element to scroll within to by testID.
 * @param {number} [speed=350] -  The speed at which to scroll
 * @param {string} [direction='down'] - The direction of which to scroll
 */
export async function scrollIntoView(scrollTo, scrollIn, speed = 350, direction = 'down') {
  try {
    await waitFor(element(by.text(scrollTo)))
      .toBeVisible()
      .whileElement(by.id(scrollIn))
      .scroll(speed, direction)
  } catch {}
}

/**
 * Scrolls to an element by testID within another
 * @param {string} scrollTo - The element to scroll to by testID.
 * @param {string} scrollIn - The element to scroll within to by testID.
 * @param {number} [speed=350] -  The speed at which to scroll
 * @param {string} [direction='down'] - The direction of which to scroll
 */
export async function scrollIntoViewByTestId(scrollTo, scrollIn, speed = 350, direction = 'down') {
  try {
    await waitFor(element(by.id(scrollTo)))
      .toBeVisible()
      .whileElement(by.id(scrollIn))
      .scroll(speed, direction)
  } catch {}
}

/**
 * Gets first most matching text by testID for no matches, one match or many matches
 * @param {string} elementId The element to get text from by testID
 * @returns {(string|null)} The text of the element or null if not found
 */
export async function getElementText(elementId) {
  try {
    const match = await element(by.id(elementId)).getAttributes()
    if (device.getPlatform() === 'ios') {
      return match.label ? match.label : (match.elements[0].label ?? null)
    } else {
      return match.text ?? null
    }
  } catch {}
}

/**
 * Gets list of matching text elements by testID - iOS only
 * https://github.com/wix/Detox/issues/3196
 * @param {string} elementId The element to get text from by testID
 * @returns {(string[])} An array of element(s) text
 */
export async function getElementTextList(elementId) {
  try {
    const found = await element(by.id(elementId)).getAttributes()
    return found.elements.map((element) => element.label)
  } catch {}
  try {
    const elementText = await getElementText(elementId)
    if (elementText) return [elementText]
  } catch {}
  return []
}

export const getDisplayAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

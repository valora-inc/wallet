import { E2E_WALLET_MNEMONIC } from 'react-native-dotenv'
import { createWalletClient, encodeFunctionData, erc20Abi, http, publicActions } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { celo } from 'viem/chains'
import { sleep } from '../../../src/utils/sleep'
import { DEFAULT_PIN } from '../utils/consts'

const childProcess = require('child_process')
const fs = require('fs')
const PNG = require('pngjs').PNG
const pixelmatch = require('pixelmatch')

function exec(command, options = { cwd: process.cwd() }) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
        return
      }

      resolve({ stdout, stderr })
    })
  })
}

export class TimeoutError extends Error {
  constructor(message) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export function timeout(asyncFunc, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError('Timeout after ' + ms + ' ms'))
    }, ms)

    asyncFunc()
      .then(resolve, reject)
      .finally(() => {
        clearTimeout(timer)
      })
  })
}

export async function skipTo(nextScreen) {
  const testID = `ButtonSkipTo${nextScreen}`
  try {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(1000)
    await element(by.id(testID)).tap()
  } catch (error) {
    throw error
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

export async function enterPinUiIfNecessary() {
  // TODO(tomm): use id's for localization after pin fix
  if (await isTextPresent('Enter PIN')) {
    await enterPinUi()
  }
}

export async function inputNumberKeypad(amount) {
  const amountStr = '' + amount
  for (const digit of amountStr) {
    await element(by.id(`digit${digit}`)).tap()
  }
}

export async function isTextPresent(text) {
  try {
    await expect(element(by.text(text))).toExist()
    return true
  } catch {
    return false
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
  stopOnCYA = false,
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
      await waitForElementByText({
        text: 'From recovery phrase',
        tap: true,
      })
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

    // Choose your own adventure (CYA screen)
    if (stopOnCYA) {
      await waitForElementById('ChooseYourAdventure/Later')
      return
    }
    await waitForElementById('ChooseYourAdventure/Later', {
      tap: true,
    })

    // Assert on Wallet Home Screen
    await expect(element(by.id('HomeAction-Send'))).toBeVisible()
  } catch {} // Don't throw an error just silently continue
}

export async function pixelDiff(imagePath, expectedImagePath, acceptableDiffPercent = 2.5) {
  const img1 = PNG.sync.read(fs.readFileSync(imagePath))
  const img2 = PNG.sync.read(fs.readFileSync(expectedImagePath))
  const { width, height } = img1
  const totalPixels = width * height
  const allowableError = (totalPixels / 100) * acceptableDiffPercent
  const diff = new PNG({ width, height })
  let diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 })
  let percentDiff = ((diffPixels / totalPixels) * 100).toFixed(2)
  if (diffPixels > allowableError) {
    // TODO: Write diff.png to artifacts if failed
    // fs.writeFileSync('diff.png', PNG.sync.write(diff))
    throw new Error(
      `Expected image at ${imagePath} to match to image at ${expectedImagePath}, but it had ${percentDiff}% pixel diff!`
    )
  }
}

//** Sets device demo mode on devices for consistent screenshots */
export async function setDemoMode() {
  if (device.getPlatform() === 'ios') {
    exec(
      `xcrun simctl status_bar "${device.id}" override --batteryState charged --batteryLevel 100 --wifiBars 3 --cellularMode active --cellularBars 4`
    )
  } else {
    // enter demo mode
    exec(`adb -s ${device.id} shell settings put global sysui_demo_allowed 1`)

    // Display full mobile data with 4g type and no wifi
    exec(
      `adb -s ${device.id} shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e level 4 -e datatype 4g -e wifi false`
    )
    // Hide notifications
    exec(
      `adb -s ${device.id} shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false`
    )
    // Show full battery but not in charging state
    exec(
      `adb -s ${device.id} shell am broadcast -a com.android.systemui.demo -e command battery -e plugged false -e level 100`
    )
  }
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

export function getDeviceModel() {
  return device.name.split(/\s(.+)/)[1].replace(/[(]|[)]/g, '')
}

export async function waitForExpectNotVisible(elementId, secondsToWait = 10) {
  for (let i in [...Array(secondsToWait).keys()]) {
    await waitFor(element(by.id(elementId)))
      .not.toBeVisible()
      .withTimeout(1000)
    await expect(element(by.id(elementId))).not.toBeVisible()
  }
}

export function padTrailingZeros(num, size = 5) {
  var s = `${num}`
  while (s.length < size) s = s + '0'
  return s
}

export async function waitForElementByText({ text, index, tap = false, timeout = 30_000 }) {
  try {
    const elementMatcher =
      index !== undefined ? element(by.text(text)).atIndex(index) : element(by.text(text))

    await waitFor(elementMatcher).toBeVisible().withTimeout(timeout)

    if (tap) await elementMatcher.tap()
  } catch {
    throw new Error(`Element with text '${text}' not found`)
  }
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

export async function completeProtectWalletScreen() {
  await expect(element(by.id('recoveryPhraseCard'))).toBeVisible()
  await element(by.id('recoveryPhraseCard')).tap()
  await enterPinUi()
  await expect(element(by.id('protectWalletBottomSheetContinue'))).toBeVisible()
  await element(by.id('protectWalletBottomSheetContinue')).tap()
}

/**
 * Fund a wallet, using some existing wallet.
 *
 * @param senderPrivateKey: private key for wallet with funds
 * @param recipientAddress: wallet to receive funds
 * @param stableToken: recognised token symbol (e.g. 'cUSD')
 * @param amountEther: amount in "ethers" (as opposed to wei)
 */
export async function fundWallet(senderPrivateKey, recipientAddress, stableToken, amountEther) {
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

export async function navigateToSecurity() {
  await waitForElementById('WalletHome/SettingsGearButton', {
    tap: true,
  })
  await waitForElementById('SettingsMenu/Security', {
    tap: true,
  })
}

export async function navigateToProfile() {
  await waitForElementById('WalletHome/SettingsGearButton', {
    tap: true,
  })
  await waitForElementById('SettingsMenu/Profile', {
    tap: true,
  })
}

export async function navigateToPreferences() {
  await waitForElementById('WalletHome/SettingsGearButton', {
    tap: true,
  })
  await waitForElementById('SettingsMenu/Preferences', {
    tap: true,
  })
}

export const getDisplayAddress = (address) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

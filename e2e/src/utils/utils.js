import { newKit } from '@celo/contractkit'
import jestExpect from 'expect'
import { ALFAJORES_FORNO_URL, DEFAULT_PIN, SAMPLE_BACKUP_KEY } from '../utils/consts'
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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
/**
 * Wait for an element to be visible for at least set amount of time
 * @param {string} elementId testID of the element to wait for
 * @param {number} timeout timeout in milliseconds
 */
export async function waitForElementId(elementId, timeout = 10 * 1000) {
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
export async function waitForElementByIdAndTap(elementId, timeout = 10 * 1000, index = 0) {
  await waitForElementId(elementId, timeout)
  index === 0
    ? await element(by.id(elementId)).tap()
    : await element(by.id(elementId)).atIndex(index).tap()
}

export function quote(s) {
  // on ios the command line uses double quotes around the string
  // while on android it does not, so we add it
  return device.getPlatform() === 'ios' ? s : `"${s}"`
}

export async function quickOnboarding({
  mnemonic = SAMPLE_BACKUP_KEY,
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

    if (cloudBackupEnabled) await waitForElementByIdAndTap('ImportSelect/Mnemonic')

    // Restore existing wallet
    await waitFor(element(by.id('connectingToCelo')))
      .not.toBeVisible()
      .withTimeout(20000)

    // Input Wallet Backup Key
    await sleep(3000)
    await element(by.id('ImportWalletBackupKeyInputField')).tap()
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
    await element(by.id('ImportWalletButton')).tap()

    try {
      // case where account not funded yet. continue with onboarding.
      await waitForElementByIdAndTap('ConfirmUseAccountDialog/PrimaryAction')
    } catch {}

    // this onboarding step is bypassed for already verified wallets
    try {
      // Verify Education
      await waitForElementId('PhoneVerificationSkipHeader')
      // Skip
      await element(by.id('PhoneVerificationSkipHeader')).tap()
    } catch {
      console.log(
        'Error trying to skip phone verification step during onboarding, likely due to wallet already being verified'
      )
    }

    // Choose your own adventure (CYA screen)
    if (stopOnCYA) {
      await waitForElementId('ChooseYourAdventure/Later')
      return
    }
    await waitForElementByIdAndTap('ChooseYourAdventure/Later')

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

/**
 * Add a comment to a send transaction
 * @param {string} comment
 */
export async function addComment(comment) {
  await waitForElementId('commentInput/send')
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
 * Confirms a transaction by checking that the comment is present in the feed and navigating to the transaction details
 * @param {string} commentText
 */
export async function confirmTransaction(commentText) {
  try {
    // the transaction should be visible because it is the most recent, however
    // the comment text may be hidden while the transaction is pending. allow
    // some time for the transaction to be settled, before asserting on the
    // comment.
    await waitFor(element(by.text(commentText)))
      .toBeVisible()
      .withTimeout(60 * 1000)

    // getAttributes() for multiple elements only supported on iOS for Detox < 20.12.0
    if (device.getPlatform() === 'ios') {
      // Comment should be present in the feed
      const { elements } = await element(by.id('TransferFeedItem/subtitle')).getAttributes()
      jestExpect(elements.some((element) => element.text === commentText)).toBeTruthy()
    }

    // Scroll to transaction
    await waitFor(element(by.text(commentText)))
      .toBeVisible()
      .whileElement(by.id('TransactionList'))
      .scroll(100, 'down')

    // Navigate to transaction details
    await element(by.text(commentText)).tap()

    // Completed and comment present in transaction details
    await waitForElementByText(commentText)
    await waitForElementByText('Completed')
  } catch (error) {
    throw new Error(`utils/confirmTransaction failed: ${error}`)
  }
}

export async function waitForElementByText(text, timeout = 30_000, index = 0) {
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

/**
 * Gets first most matching text by testID for no matches, one match or many matches
 * @param {string} elementId The element to get text from by testID
 * @returns {(string|null)} The text of the element or null if not found
 */
export async function getElementText(elementId) {
  try {
    const match = await element(by.id(elementId)).getAttributes()
    if (device.getPlatform() === 'ios') {
      return match.label ? match.label : match.elements[0].label ?? null
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
 * @param stableToken: ContractKit-recognized stable token
 * @param amountEther: amount in "ethers" (as opposed to wei)
 */
export async function fundWallet(senderPrivateKey, recipientAddress, stableToken, amountEther) {
  const kit = newKit(ALFAJORES_FORNO_URL)
  const { address: senderAddress } = kit.web3.eth.accounts.privateKeyToAccount(senderPrivateKey)
  console.log(`Sending ${amountEther} ${stableToken} from ${senderAddress} to ${recipientAddress}`)
  kit.connection.addAccount(senderPrivateKey)
  const tokenContract = await kit.contracts.getStableToken(stableToken)
  const amountWei = kit.web3.utils.toWei(amountEther, 'ether')
  const receipt = await tokenContract
    .transfer(recipientAddress, amountWei.toString())
    .sendAndWaitForReceipt({ from: senderAddress })
  console.log('Funding TX receipt', receipt)
}

export const createCommentText = () => {
  return `${new Date().getTime()}-${parseInt(Math.random() * 100_000)}`
}

export async function navigateToSettings() {
  await waitForElementByIdAndTap('WalletHome/AccountCircle')
  await waitForElementByIdAndTap('ProfileMenu/Settings')
}

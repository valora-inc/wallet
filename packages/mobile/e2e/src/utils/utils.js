import { SAMPLE_BACKUP_KEY, EXAMPLE_NAME, DEFAULT_PIN } from '../utils/consts'
import { dismissBanners } from '../utils/banners'
const childProcess = require('child_process')

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

export async function enterPinUi() {
  for (const digit of DEFAULT_PIN) {
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

export async function isElementExistant(elementId) {
  try {
    await expect(element(by.id(elementId))).toExist()
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

export async function waitForElementId(elementId) {
  await waitFor(element(by.id(elementId)))
    .toBeVisible()
    .withTimeout(10000)
}

export function quote(s) {
  // on ios the command line uses double quotes around the string
  // while on android it does not, so we add it
  return device.getPlatform() === 'ios' ? s : `"${s}"`
}

export async function quickOnboarding() {
  // Quickly pass through openning slides
  for (let i = 0; i < 3; i++) {
    await element(by.id('Education/progressButton')).tap()
  }

  // Tap Restore Account
  await element(by.id('RestoreAccountButton')).tap()

  // Accept Terms
  await element(by.id('scrollView')).scrollTo('bottom')
  await expect(element(by.id('AcceptTermsButton'))).toBeVisible()
  await element(by.id('AcceptTermsButton')).tap()

  // Name and Picture
  await element(by.id('NameEntry')).replaceText(EXAMPLE_NAME)
  await element(by.id('NameAndPictureContinueButton')).tap()

  // Set pin
  await enterPinUi()
  // Verify pin
  await enterPinUi()

  // Restore existing wallet
  await waitFor(element(by.id('connectingToCelo')))
    .not.toBeVisible()
    .withTimeout(20000)
  // Input Wallet Backup Key
  await element(by.id('ImportWalletBackupKeyInputField')).tap()
  await element(by.id('ImportWalletBackupKeyInputField')).replaceText(`${SAMPLE_BACKUP_KEY}`)
  if (device.getPlatform() === 'ios') {
    // On iOS, type one more space to workaround onChangeText not being triggered with replaceText above
    // and leaving the restore button disabled
    await element(by.id('ImportWalletBackupKeyInputField')).typeText('\n')
  } else if (device.getPlatform() === 'android') {
    // Press back button to close the keyboard
    await device.pressBack()
  }
  await element(by.id('ImportWalletButton')).tap()

  // Dismiss banners if present
  await dismissBanners()

  // Verify Education
  await waitForElementId('VerificationEducationSkipHeader')
  // Skip
  await element(by.id('VerificationEducationSkipHeader')).tap()
  // Confirmation popup skip
  await element(by.id('VerificationSkipDialog/PrimaryAction')).tap()

  // Assert on Wallet Home Screen
  await expect(element(by.id('SendOrRequestBar'))).toBeVisible()
}

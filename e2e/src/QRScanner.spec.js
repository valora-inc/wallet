import { reloadReactNative } from './utils/retries'
import { quickOnboarding, waitForElementById } from './utils/utils'

const verifyCamera = async () => {
  // testID 'Camera' is one of the few that works on Android. iOS uses 'CameraScanInfo' because the camera is behind an opacity overlay
  device.getPlatform() === 'ios'
    ? await waitForElementById('CameraScanInfo')
    : await waitForElementById('Camera')
}

describe('Given QR Scanner', () => {
  beforeAll(async () => {
    await quickOnboarding()
    await reloadReactNative()
  })

  describe('When opening QR scanner', () => {
    it('Then should display QR code', async () => {
      await waitForElementById('HomeAction-Receive', { tap: true })
      await waitForElementById('QRCode')
    })

    it('Then should be able to toggle camera', async () => {
      await waitForElementById('Scan', { tap: true })
      await verifyCamera()
    })

    it('Then should be able to toggle to QR code', async () => {
      await waitForElementById('My Code', { tap: true })
      await waitForElementById('QRCode')
    })

    it('Then should be able to close QR code scanner', async () => {
      await waitForElementById('Times', { tap: true })
      await waitForElementById('HomeAction-Send')
    })
  })

  describe("When 'scanning' QR", () => {
    beforeEach(async () => {
      await reloadReactNative()
      await waitForElementById('HomeAction-Receive', { tap: true })
      await waitForElementById('Scan', { tap: true })
      await verifyCamera()
    })

    it('Then should be able to handle Celo pay QR', async () => {
      // Use instead of waitForElementById as the element is not visible behind opacity overlay
      await element(by.id('CameraScanInfo')).tap()
      await waitForElementById('ManualInput')
      await element(by.id('ManualInput')).replaceText(
        'celo://wallet/pay?address=0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846'
      )
      await waitForElementById('ManualSubmit')
      await element(by.id('ManualSubmit')).tap()

      await waitForElementById('SendEnterAmount/AmountOptions')
      await element(by.text('Done')).tap() // dismiss the keyboard to reveal the proceed button
      await expect(element(by.id('SendEnterAmount/ReviewButton'))).toBeVisible()
    })

    it('Then should handle address only QR', async () => {
      // Use instead of waitForElementById as the element is not visible behind opacity overlay
      await element(by.id('CameraScanInfo')).tap()
      await waitForElementById('ManualInput')
      await element(by.id('ManualInput')).replaceText('0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846')
      await waitForElementById('ManualSubmit')
      await element(by.id('ManualSubmit')).tap()

      await waitForElementById('SendEnterAmount/AmountOptions')
      await element(by.text('Done')).tap() // dismiss the keyboard to reveal the proceed button
      await expect(element(by.id('SendEnterAmount/ReviewButton'))).toBeVisible()
    })

    it.todo('Then should be able to wc QR')
  })
})

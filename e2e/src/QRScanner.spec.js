import { reloadReactNative } from './utils/retries'
import { quickOnboarding, waitForElementById } from './utils/utils'

describe('Given QR Scanner', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When opening QR scanner', () => {
    it('Then should display QR code', async () => {
      await reloadReactNative()
      await waitForElementById('HomeAction-Receive')
      await element(by.id('HomeAction-Receive')).tap()
      await waitForElementById('QRCode')
      await expect(element(by.id('QRCode'))).toBeVisible()
    })

    it('Then should be able to toggle camera', async () => {
      await waitForElementById('Scan')
      await element(by.id('Scan')).tap()
      await waitForElementById('CameraScanInfo')
      await expect(element(by.id('CameraScanInfo'))).toBeVisible()
    })

    it('Then should be able to toggle to QR code', async () => {
      await waitForElementById('My Code')
      await element(by.id('My Code')).tap()
      await waitForElementById('QRCode')
      await expect(element(by.id('QRCode'))).toBeVisible()
    })

    it('Then should be able to close QR code scanner', async () => {
      await waitForElementById('Times')
      await element(by.id('Times')).tap()
      await waitForElementById('HomeAction-Send')
      await expect(element(by.id('HomeAction-Send'))).toBeVisible()
    })
  })

  describe("When 'scanning' QR", () => {
    beforeEach(async () => {
      await reloadReactNative()
      await waitForElementById('HomeAction-Receive')
      await element(by.id('HomeAction-Receive')).tap()
      await waitForElementById('Scan')
      await element(by.id('Scan')).tap()
      await waitForElementById('CameraScanInfo')
      await element(by.id('CameraScanInfo')).tap()
    })

    it('Then should be able to handle Celo pay QR', async () => {
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

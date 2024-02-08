import { reloadReactNative, launchApp } from './utils/retries'
import { quickOnboarding, waitForElementId } from './utils/utils'

// Re-enable for android when react-native-reanimated is updated to v3
// https://linear.app/valora/issue/ENG-76/[wallet]-update-react-native-reanimated-to-v3
describe(':ios: Given QR Scanner', () => {
  beforeAll(async () => {
    await quickOnboarding()
    await launchApp({
      newInstance: true,
      launchArgs: {
        statsigGateOverrides: `use_new_send_flow=true`,
      },
    })
  })

  describe('When opening QR scanner', () => {
    it('Then should display QR code', async () => {
      await reloadReactNative()
      await waitForElementId('HomeAction-Receive')
      await element(by.id('HomeAction-Receive')).tap()
      await waitForElementId('QRCode')
      await expect(element(by.id('QRCode'))).toBeVisible()
    })

    it('Then should be able to toggle camera', async () => {
      await waitForElementId('Scan')
      await element(by.id('Scan')).tap()
      await waitForElementId('CameraScanInfo')
      await expect(element(by.id('CameraScanInfo'))).toBeVisible()
    })

    it('Then should be able to toggle to QR code', async () => {
      await waitForElementId('My Code')
      await element(by.id('My Code')).tap()
      await waitForElementId('QRCode')
      await expect(element(by.id('QRCode'))).toBeVisible()
    })

    it('Then should be able to close QR code scanner', async () => {
      await waitForElementId('Times')
      await element(by.id('Times')).tap()
      await waitForElementId('HomeAction-Send')
      await expect(element(by.id('HomeAction-Send'))).toBeVisible()
    })
  })

  describe("When 'scanning' QR", () => {
    beforeEach(async () => {
      await reloadReactNative()
      await waitForElementId('HomeAction-Receive')
      await element(by.id('HomeAction-Receive')).tap()
      await waitForElementId('Scan')
      await element(by.id('Scan')).tap()
      await waitForElementId('CameraScanInfo')
      await element(by.id('CameraScanInfo')).tap()
    })

    it('Then should be able to handle Celo pay QR', async () => {
      await waitForElementId('ManualInput')
      await element(by.id('ManualInput')).replaceText(
        'celo://wallet/pay?address=0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846'
      )
      await waitForElementId('ManualSubmit')
      await element(by.id('ManualSubmit')).tap()
      await waitForElementId('SendEnterAmount/ReviewButton')
      await expect(element(by.id('SendEnterAmount/ReviewButton'))).toBeVisible()
    })

    it('Then should handle address only QR', async () => {
      await waitForElementId('ManualInput')
      await element(by.id('ManualInput')).replaceText('0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846')
      await waitForElementId('ManualSubmit')
      await element(by.id('ManualSubmit')).tap()
      await waitForElementId('SendEnterAmount/ReviewButton')
      await expect(element(by.id('SendEnterAmount/ReviewButton'))).toBeVisible()
    })

    it.todo('Then should be able to wc QR')
  })
})

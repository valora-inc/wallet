import { launchApp } from '../utils/retries'
import { quickOnboarding, sleep, waitForElementId } from '../utils/utils'

export default ChooseYourAdventure = () => {
  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await launchApp({
      newInstance: true,
      launchArgs: {
        statsigGateOverrides: `show_cloud_account_backup_setup=true,show_cloud_account_backup_restore=true`,
      },
    })
    await quickOnboarding({ stopOnCYA: true, cloudBackupEnabled: true })
  })

  it('learn about celo navigates to celo token details page', async () => {
    await element(by.text('Learn about Celo')).tap()

    // Check that we are on the Celo token details page
    await waitForElementId('TokenDetails/AssetValue')
    await expect(element(by.text('Celo')).atIndex(0)).toBeVisible()

    // Back should go to the home screen
    await element(by.id('BackChevron')).tap()
    await waitForElementId('HomeAction-Send')
  })

  it('build my profile navigates to profile page', async () => {
    await element(by.text('Build my profile')).tap()

    // Check that we are on the profile page
    await waitForElementId('ProfileEditName')

    // Back should go to the home screen
    await element(by.id('CancelButton')).tap()
    await waitForElementId('HomeAction-Send')
  })

  it('add funds navigates to home and opens the token bottom sheet', async () => {
    await element(by.text('Add funds')).tap()

    // Check that we are on the bottom sheet
    await waitForElementId('FiatExchangeCurrencyBottomSheet')

    // dismissing the bottom sheet should show home screen
    await element(by.id('FiatExchangeCurrencyBottomSheet')).swipe('down')
    await waitForElementId('HomeAction-Send')
  })

  it('find ways to use crypto navigates to discover tab', async () => {
    await element(by.text('Find ways to use crypto')).tap()

    // Check that we are on the discover tab
    await waitForElementId('DAppsExplorerScreen')
  })
}

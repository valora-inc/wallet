import { launchApp } from '../utils/retries'
import { quickOnboarding, waitForElementId } from '../utils/utils'

export default ChooseYourAdventure = () => {
  beforeEach(async () => {
    await device.uninstallApp()
    await device.installApp()
    await launchApp({
      newInstance: true,
      launchArgs: {
        statsigGateOverrides: `show_cloud_account_backup_setup=true,show_cloud_account_backup_restore=true,show_onboarding_phone_verification=true`,
      },
    })
    await quickOnboarding({ stopOnCYA: true, cloudBackupEnabled: true })
  })

  it('learn about points navigates to points journey page', async () => {
    await element(by.text('Learn about Valora Points')).tap()

    // Check that we are on the Points journey page
    await expect(element(by.text('Earn points effortlessly')).atIndex(0)).toBeVisible()

    // Back should go to the home screen
    await element(by.id('BackChevron')).tap()
    await waitForElementId('HomeAction-Send')
  })

  it('build your profile navigates to profile page', async () => {
    await element(by.text('Build your profile')).tap()

    // Check that we are on the profile page
    await waitForElementId('ProfileEditName')

    // Back should go to the home screen
    await element(by.id('BackButton')).tap()
    await waitForElementId('HomeAction-Send')
  })

  it('add funds to your wallet navigates to home and opens the token bottom sheet', async () => {
    await element(by.text('Add funds to your wallet')).tap()

    // Check that we are on the bottom sheet
    await waitForElementId('TokenBottomSheet')

    // dismissing the bottom sheet should show home screen
    await element(by.id('TokenBottomSheet')).swipe('down')
    await waitForElementId('HomeAction-Send')
  })

  it('explore earning opportunities navigates to stablecoins info page', async () => {
    await element(by.text('Explore earning opportunities')).tap()

    await waitForElementId('EarnInfoScreen/Title')
    // Check that we are on the Earn On Your Stablecoins page
    await expect(element(by.text('Earn on your\nstablecoins')).atIndex(0)).toBeVisible()
  })
}

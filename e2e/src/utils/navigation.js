import { waitForElementById } from './utils'

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

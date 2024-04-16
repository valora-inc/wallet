import { generateMnemonic } from '@celo/cryptographic-utils'
import { DEFAULT_RECIPIENT_ADDRESS, SAMPLE_BACKUP_KEY } from '../utils/consts'
import { launchApp } from '../utils/retries'
import { quickOnboarding, waitForElementByIdAndTap, waitForElementId } from '../utils/utils'

export default Assets = () => {
  describe.each([
    {
      balance: 'non zero',
    },
    {
      balance: 'zero',
    },
  ])('For wallet with $balance balance', ({ balance, tokens }) => {
    beforeAll(async () => {
      // uninstall and reinstall to start with either a new account or the usual
      // e2e account
      await device.uninstallApp()
      await device.installApp()
      await launchApp({
        newInstance: true,
        permissions: { notifications: 'YES', contacts: 'YES', camera: 'YES' },
        launchArgs: {
          statsigGateOverrides: `use_tab_navigator=false`,
        },
      })
      let mnemonic = SAMPLE_BACKUP_KEY
      if (balance === 'zero') {
        mnemonic = await generateMnemonic()
      }
      await quickOnboarding({ mnemonic })
    })

    it('navigates to Assets screen from home', async () => {
      await waitForElementByIdAndTap('ViewBalances')
      await waitForElementId('Assets/TabBar')
    })

    it('switching tabs displays corresponding assets', async () => {
      await expect(element(by.id('TokenBalanceItem')).atIndex(0)).toBeVisible()
      await element(by.id('Assets/TabBarItem')).atIndex(1).tap()
      await waitForElementId('Assets/NoNfts')
      await element(by.id('Assets/TabBarItem')).atIndex(0).tap()
      await expect(element(by.id('TokenBalanceItem')).atIndex(0)).toBeVisible()
    })
  })
}

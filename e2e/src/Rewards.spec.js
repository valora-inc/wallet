import { enterPinUiIfNecessary, quickOnboarding, waitForElementId, sleep } from './utils/utils'

describe('Given Rewards', () => {
  beforeAll(async () => {
    await quickOnboarding()
  })

  describe('When Tapping Rewards Icon', () => {
    it('Then should display rewards icon in side menu', async () => {
      await waitForElementId('Hamburger')
      await element(by.id('Hamburger')).tap()
      await waitForElementId('EarnRewards')
      await expect(element(by.id('EarnRewards'))).toBeVisible()
    })

    it('Then should navigate to consumer incentives when rewards icon tapped', async () => {
      await waitForElementId('EarnRewards')
      await element(by.id('EarnRewards')).tap()
      await waitForElementId('SuperchargeInstructions')
      await expect(element(by.id('SuperchargeInstructions'))).toBeVisible()
    })

    it('Then should navigate to connect phone number', async () => {
      await waitForElementId('ConsumerIncentives/CTA')
      await element(by.id('ConsumerIncentives/CTA')).tap()
      await enterPinUiIfNecessary()
      await waitForElementId('VerificationEducationHeader')
      await expect(element(by.id('VerificationEducationHeader'))).toBeVisible()
    })

    it(':ios: Then should navigate back to consumer incentives', async () => {
      await waitForElementId('BackChevron')
      await element(by.id('BackChevron')).tap()
      await waitForElementId('ConsumerIncentives/CTA')
      await expect(element(by.id('ConsumerIncentives/CTA'))).toBeVisible()
    })

    // Enable when invite rewards v3 is live - est 08/15/2022
    it.skip(':ios: Then should display Valoraapp.com when tapping Learn more', async () => {
      await waitForElementId('LearnMore')
      await element(by.id('LearnMore')).tap()
      await waitForElementId('RNWebView')
      await waitFor(element(by.id('HeaderTitle').withAncestor(by.id('WebViewTitle'))))
        .toHaveText('How do I get rewards with Supercharge? – Valora Support')
        .withTimeout(10 * 1000)
      await waitFor(element(by.id('HeaderSubTitle').withAncestor(by.id('WebViewTitle'))))
        .toHaveText('support.valoraapp.com')
        .withTimeout(10 * 1000)
    })
  })
})

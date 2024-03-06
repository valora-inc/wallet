import { generateMnemonic } from '@celo/cryptographic-utils'
import { DEFAULT_RECIPIENT_ADDRESS, SAMPLE_BACKUP_KEY } from '../utils/consts'
import { launchApp } from '../utils/retries'
import {
  quickOnboarding,
  waitForElementByIdAndTap,
  waitForElementId,
  dismissCashInBottomSheet,
} from '../utils/utils'

async function validateSendFlow(tokenSymbol) {
  // navigate to send amount screen to ensure the expected token symbol is pre-selected
  await waitForElementByIdAndTap('SendSelectRecipientSearchInput')
  await element(by.id('SendSelectRecipientSearchInput')).replaceText(DEFAULT_RECIPIENT_ADDRESS)
  await element(by.id('SendSelectRecipientSearchInput')).tapReturnKey()
  await expect(element(by.text('0xe5f5...8846')).atIndex(0)).toBeVisible()
  await element(by.text('0xe5f5...8846')).atIndex(0).tap()
  await waitForElementByIdAndTap('SendOrInviteButton')
  await expect(
    element(by.text(tokenSymbol).withAncestor(by.id('SendEnterAmount/TokenSelect')))
  ).toBeVisible()
  await element(by.id('BackChevron')).tap()
  await element(by.id('Times')).tap()
}

async function validateAddFlow(tokenSymbol) {
  // check the header includes the appropriate token symbol
  await waitFor(element(by.id('HeaderTitle')))
    .toHaveText(`Add ${tokenSymbol}`)
    .withTimeout(10 * 1000)
  await element(by.id('BackChevron')).tap()
}

export default Assets = () => {
  describe.each([
    {
      balance: 'non zero',
      tokens: [
        {
          tokenId: 'celo-alfajores:native',
          symbol: 'CELO',
          actions: ['Send', 'Add'],
          moreActions: ['Send', 'Add', 'Withdraw'],
          learnMore: true,
        },
        {
          tokenId: 'celo-alfajores:0x048f47d358ec521a6cf384461d674750a3cb58c8',
          symbol: 'TT',
          actions: ['Send'],
          moreActions: [],
          learnMore: false,
        },
      ],
    },
    {
      balance: 'zero',
      tokens: [
        {
          tokenId: 'celo-alfajores:native',
          symbol: 'CELO',
          actions: ['Add'],
          moreActions: [],
          learnMore: true,
        },
        {
          tokenId: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
          symbol: 'cUSD',
          actions: ['Add'],
          moreActions: [],
          learnMore: true,
        },
      ],
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
      })
      let mnemonic = SAMPLE_BACKUP_KEY
      if (balance === 'zero') {
        mnemonic = await generateMnemonic()
      }
      await quickOnboarding(mnemonic)
      await dismissCashInBottomSheet()
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

    describe.each(tokens)('For $symbol', ({ symbol, tokenId, learnMore, actions, moreActions }) => {
      it('navigates to asset details on tapping asset', async () => {
        await waitForElementByIdAndTap(`TokenBalanceItemTouchable/${tokenId}`)
        await waitForElementId('TokenDetails/AssetValue')
      })

      if (actions.includes('Send')) {
        it('send action navigates to send flow', async () => {
          await element(by.id('TokenDetails/Action/Send')).tap()
          await validateSendFlow(symbol)
          await waitForElementId('TokenDetails/AssetValue')
        })
      }

      if (actions.includes('Add')) {
        it('add action navigates to add cico flow', async () => {
          await element(by.id('TokenDetails/Action/Add')).tap()
          await validateAddFlow(symbol)
          await waitForElementId('TokenDetails/AssetValue')
        })
      }

      if (moreActions.includes('Send')) {
        it('send action under more actions navigates to send flow', async () => {
          await element(by.id('TokenDetails/Action/More')).tap()
          await waitForElementByIdAndTap('TokenDetailsMoreActions/Send')
          await validateSendFlow(symbol)
          await element(by.id('TokenDetailsMoreActions')).swipe('down')
          await waitForElementId('TokenDetails/AssetValue')
        })
      }

      if (moreActions.includes('Add')) {
        it('add action under more actions navigates to add cico flow', async () => {
          await element(by.id('TokenDetails/Action/More')).tap()
          await waitForElementByIdAndTap('TokenDetailsMoreActions/Add')
          await validateAddFlow(symbol)
          await element(by.id('TokenDetailsMoreActions')).swipe('down')
          await waitForElementId('TokenDetails/AssetValue')
        })
      }

      if (moreActions.includes('Withdraw')) {
        it('withdraw action under more actions navigates to withdraw spend screen', async () => {
          await element(by.id('TokenDetails/Action/More')).tap()
          await waitForElementByIdAndTap('TokenDetailsMoreActions/Withdraw')
          await waitForElementId('FiatExchangeTokenBalance')
          await element(by.id('BackChevron')).tap()
          await element(by.id('TokenDetailsMoreActions')).swipe('down')
          await waitForElementId('TokenDetails/AssetValue')
        })
      }

      if (learnMore) {
        it('learn more navigates to coingecko page', async () => {
          await waitForElementByIdAndTap('TokenDetails/LearnMore')
          await waitForElementId('RNWebView')
          await waitFor(element(by.text('www.coingecko.com')))
            .toBeVisible()
            .withTimeout(10 * 1000)
          await element(by.id('WebViewScreen/CloseButton')).tap()
          await waitForElementId('TokenDetails/AssetValue')
        })
      }

      it('navigates back to Assets page', async () => {
        await element(by.id('BackChevron')).tap()
        await waitForElementId('Assets/TabBar')
      })
    })
  })
}

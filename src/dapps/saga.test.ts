import { FetchMock } from 'jest-fetch-mock/types'
import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { handleFetchDappsList, handleOpenDapp } from 'src/dapps/saga'
import { dappsListApiUrlSelector, dappsWebViewEnabledSelector } from 'src/dapps/selectors'
import { dappSelected, fetchDappsListCompleted, fetchDappsListFailed } from 'src/dapps/slice'
import { Dapp, DappSection } from 'src/dapps/types'
import { currentLanguageSelector } from 'src/i18n/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getExperimentParams } from 'src/statsig'
import { walletAddressSelector } from 'src/web3/selectors'
import { mockAccount } from 'test/values'

jest.mock('src/statsig')

describe('Dapps saga', () => {
  describe('Handles opening a dapp', () => {
    const baseDapp: Dapp = {
      id: 'dapp',
      categories: ['some category'],
      iconUrl: 'https://someIcon.url',
      name: 'Dapp',
      description: 'some description',
      dappUrl: 'https://someDapp.url',
    }

    it('opens a web view', async () => {
      await expectSaga(
        handleOpenDapp,
        dappSelected({ dapp: { ...baseDapp, openedFrom: DappSection.All } })
      )
        .provide([[select(dappsWebViewEnabledSelector), true]])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
        uri: baseDapp.dappUrl,
      })
    })

    it('opens a deep link', async () => {
      await expectSaga(
        handleOpenDapp,
        dappSelected({
          dapp: {
            ...baseDapp,
            dappUrl: 'celo://wallet/bidali',
            openedFrom: DappSection.All,
          },
        })
      )
        .provide([
          [select(dappsWebViewEnabledSelector), true],
          [select(walletAddressSelector), mockAccount],
        ])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, { currency: undefined })
    })
  })

  describe('Handles fetching dapp list', () => {
    const mockFetch = fetch as FetchMock
    beforeEach(() => {
      mockFetch.resetMocks()
    })

    it('does not fetch the dapps list if the wallet is not yet initialized', async () => {
      await expectSaga(handleFetchDappsList)
        .provide([
          [select(dappsListApiUrlSelector), 'http://some.url'],
          [select(walletAddressSelector), null],
        ])
        .run()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('saves the dapps and categories', async () => {
      const dapp1 = {
        categories: ['finance-tools'],
        description: 'Staking CELO made easy',
        id: 'churritofi',
        logoUrl:
          'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/churritofi.png',
        name: 'ChurritoFi',
        url: 'https://churrito.fi',
      }
      const dapp2 = {
        categories: ['spend'],
        description: 'Book flights around the world with cUSD and cEUR',
        id: 'flywallet',
        logoUrl: 'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/flywallet.png',
        name: 'Flywallet',
        url: 'https://pro.flywallet.io',
      }
      const categories = [
        {
          backgroundColor: '#FDF0CE',
          fontColor: '#BF8800',
          id: 'spend',
          name: 'Spend',
        },
        {
          backgroundColor: '#E5E8FB',
          fontColor: '#4E61E2',
          id: 'finance-tools',
          name: 'Financial Tools',
        },
      ]
      mockFetch.mockResponse(
        JSON.stringify({
          applications: [dapp1, dapp2],
          categories,
          featured: dapp1,
          mostPopularDapps: ['churritofi'],
        })
      )
      jest.mocked(getExperimentParams).mockReturnValue({
        dappsFilterEnabled: true,
        dappsSearchEnabled: true,
      })

      await expectSaga(handleFetchDappsList)
        .provide([
          [select(dappsListApiUrlSelector), 'http://some.url'],
          [select(walletAddressSelector), '0xabc'],
          [select(currentLanguageSelector), 'en'],
        ])
        .put(
          fetchDappsListCompleted({
            dapps: [
              {
                categories: ['finance-tools'],
                description: 'Staking CELO made easy',
                id: 'churritofi',
                iconUrl:
                  'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/churritofi.png',
                name: 'ChurritoFi',
                dappUrl: 'https://churrito.fi',
              },
              {
                categories: ['spend'],
                description: 'Book flights around the world with cUSD and cEUR',
                id: 'flywallet',
                iconUrl:
                  'https://raw.githubusercontent.com/valora-inc/dapp-list/main/assets/flywallet.png',
                name: 'Flywallet',
                dappUrl: 'https://pro.flywallet.io',
              },
            ],
            categories,
            mostPopularDappIds: ['churritofi'],
          })
        )
        .run()

      expect(mockFetch).toHaveBeenCalledWith(
        'http://some.url?language=en&address=0xabc&version=2',
        {
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          method: 'GET',
        }
      )
    })

    it('saves an error', async () => {
      mockFetch.mockRejectOnce()
      jest.mocked(getExperimentParams).mockReturnValue({
        dappsFilterEnabled: true,
        dappsSearchEnabled: true,
      })

      await expectSaga(handleFetchDappsList)
        .provide([
          [select(dappsListApiUrlSelector), 'http://some.url'],
          [select(walletAddressSelector), '0xabc'],
          [select(currentLanguageSelector), 'en'],
        ])
        .put(
          fetchDappsListFailed({
            error: 'Could not fetch dapps',
          })
        )
        .run()
    })
  })
})

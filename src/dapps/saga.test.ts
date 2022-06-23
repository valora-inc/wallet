import { expectSaga } from 'redux-saga-test-plan'
import { select } from 'redux-saga/effects'
import { handleOpenDapp } from 'src/dapps/saga'
import { dappsWebViewEnabledSelector } from 'src/dapps/selectors'
import { DappSection, dappSelected } from 'src/dapps/slice'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

describe('Dapps saga', () => {
  describe('Handles opening a dapp', () => {
    const baseDapp = {
      id: 'dapp',
      categoryId: 'some category',
      iconUrl: 'https://someIcon.url',
      name: 'Dapp',
      description: 'some description',
      dappUrl: 'https://someDapp.url',
      isFeatured: false,
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
        .provide([[select(dappsWebViewEnabledSelector), true]])
        .run()

      expect(navigate).toHaveBeenCalledWith(Screens.BidaliScreen, { currency: undefined })
    })
  })
})

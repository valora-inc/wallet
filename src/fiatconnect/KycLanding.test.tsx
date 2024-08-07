import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { KycStatus } from 'src/account/reducer'
import { CICOEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import KycLanding from 'src/fiatconnect/KycLanding'
import { personaFinished, personaStarted, postKyc } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdTokenId, mockFiatConnectQuotes } from 'test/values'

jest.mock('src/account/Persona')
jest.mock('src/analytics/AppAnalytics')

describe('KycLanding', () => {
  const normalizedQuote = new FiatConnectQuote({
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
    tokenId: mockCusdTokenId,
  })

  const store = createMockStore({
    fiatConnect: {
      personaInProgress: false,
    },
  })
  store.dispatch = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('step one', () => {
    const props = getMockStackScreenProps(Screens.KycLanding, {
      flow: CICOFlow.CashOut,
      quote: normalizedQuote,
      personaKycStatus: KycStatus.Completed,
      step: 'one',
    })
    it('shows step two greyed out when in step one mode', () => {
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )

      expect(queryByTestId('step-one-grey')).toBeFalsy()
      expect(queryByTestId('step-two-grey')).toBeTruthy()

      expect(getByTestId('checkbox/unchecked')).toBeTruthy()
      expect(getByTestId('continueButton')).toBeDisabled()
    })
    it('only lets you click on the persona button after accepting the privacy policy', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )

      expect(getByTestId('PersonaButton')).toBeDisabled()
      fireEvent.press(getByTestId('checkbox/unchecked'))
      expect(getByTestId('PersonaButton')).not.toBeDisabled()
    })
    it('triggers analytics and dispatches persona started when persona button is pressed', () => {
      AppAnalytics.track = jest.fn()
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      fireEvent.press(getByTestId('checkbox/unchecked'))
      fireEvent.press(getByTestId('PersonaButton'))
      jest.advanceTimersByTime(600)
      expect(AppAnalytics.track).toHaveBeenCalledWith(CICOEvents.persona_kyc_start)
      expect(store.dispatch).toHaveBeenCalledWith(personaStarted())
    })
    it('dispatches post kyc when persona succeeds', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      fireEvent.press(getByTestId('checkbox/unchecked'))
      // 'PersonaSuccessButton' is a mock that calls onSuccess when pressed
      fireEvent.press(getByTestId('PersonaSuccessButton'))
      expect(store.dispatch).toHaveBeenCalledWith(postKyc({ quote: normalizedQuote }))
    })
    it('dispatches persona finished when persona flow errors', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      fireEvent.press(getByTestId('checkbox/unchecked'))
      fireEvent.press(getByTestId('PersonaErrorButton'))
      expect(store.dispatch).toHaveBeenCalledWith(personaFinished())
    })
    it('dispatches persona finished when persona flow is canceled', () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      fireEvent.press(getByTestId('checkbox/unchecked'))
      // 'PersonaCancelButton' is a mock that calls onCanceled when pressed
      fireEvent.press(getByTestId('PersonaCancelButton'))
      expect(store.dispatch).toHaveBeenCalledWith(personaFinished())
    })
    it('shows loading screen if persona is in progress', () => {
      const store = createMockStore({
        fiatConnect: {
          personaInProgress: true,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      expect(getByTestId('personaInProgress')).toBeTruthy()
    })
  })

  describe('step two', () => {
    const props = getMockStackScreenProps(Screens.KycLanding, {
      flow: CICOFlow.CashOut,
      quote: normalizedQuote,
      personaKycStatus: undefined,
      step: 'two',
    })
    it('shows step one greyed out when in step two mode', () => {
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )

      expect(queryByTestId('step-one-grey')).toBeTruthy()
      expect(queryByTestId('step-two-grey')).toBeFalsy()

      expect(getByTestId('checkbox/checked')).toBeTruthy()
      expect(getByTestId('continueButton')).not.toBeDisabled()
      expect(getByTestId('PersonaButton')).toBeDisabled()
    })
  })
})

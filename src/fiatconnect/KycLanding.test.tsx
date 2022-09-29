import { FiatAccountType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import * as Persona from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import KycLanding from 'src/fiatconnect/KycLanding'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockFiatConnectQuotes, mockPrivateDEK } from 'test/values'

jest.mock('src/account/Persona')
jest.mock('src/analytics/ValoraAnalytics')

describe('KycLanding', () => {
  const normalizedQuote = new FiatConnectQuote({
    quote: mockFiatConnectQuotes[1] as FiatConnectQuoteSuccess,
    fiatAccountType: FiatAccountType.BankAccount,
    flow: CICOFlow.CashOut,
  })

  const store = createMockStore({
    web3: {
      mtwAddress: mockAccount,
      dataEncryptionKey: mockPrivateDEK,
    },
  })

  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('step one', () => {
    const props = getMockStackScreenProps(Screens.KycLanding, {
      flow: CICOFlow.CashOut,
      quote: normalizedQuote,
      personaKycStatus: KycStatus.Completed,
      step: 'one',
    })
    it('shows step two greyd out when in step one mode', () => {
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )

      expect(queryByTestId('step-one-grey')).toBeFalsy()
      expect(queryByTestId('step-two-grey')).toBeTruthy()

      expect(getByTestId('continueButton')).toBeDisabled()
    })
    it('only lets you click on the persona button after accepting the privacy policy', async () => {
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )

      expect(getByTestId('PersonaButton')).toBeDisabled()
      fireEvent.press(getByTestId('checkbox'))
      expect(getByTestId('PersonaButton')).not.toBeDisabled()
    })
    it('passes a callback function for successful persona result', () => {
      const mockPersonaButton = jest.fn(() => <View></View>)
      jest.spyOn(Persona, 'default').mockImplementation(mockPersonaButton)
      render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      expect(Persona.default).toHaveBeenCalledWith(
        expect.objectContaining({ onSuccess: expect.any(Function) }), // props for Persona
        expect.anything()
      )
      jest.restoreAllMocks()
    })
    it('triggers analytics when persona button is pressed', () => {
      jest.spyOn(ValoraAnalytics, 'track')
      const { getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )
      fireEvent.press(getByTestId('PersonaButton'))
      expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.persona_kyc_start)
      jest.clearAllMocks()
    })
  })

  describe('step two', () => {
    const props = getMockStackScreenProps(Screens.KycLanding, {
      flow: CICOFlow.CashOut,
      quote: normalizedQuote,
      personaKycStatus: undefined,
      step: 'two',
    })
    it('shows step one greyd out when in step two mode', () => {
      const { queryByTestId, getByTestId } = render(
        <Provider store={store}>
          <KycLanding {...props} />
        </Provider>
      )

      expect(queryByTestId('step-one-grey')).toBeTruthy()
      expect(queryByTestId('step-two-grey')).toBeFalsy()

      expect(getByTestId('PersonaButton')).toBeDisabled()
      expect(getByTestId('continueButton')).not.toBeDisabled()
    })
  })
})

import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { Provider } from 'react-redux'
import * as React from 'react'
import FiatConnectReviewScreenWrapper from 'src/fiatconnect/ReviewScreenWrapper'
import { Screens } from 'src/navigator/Screens'
import { KycSchema, FiatType } from '@fiatconnect/fiatconnect-types'
import { render } from '@testing-library/react-native'
import { navigate } from 'src/navigator/NavigationService'
import { refetchQuote } from 'src/fiatconnect/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { Currency } from 'src/utils/currencies'

const store = createMockStore()

describe('ReviewScreenWrapper', () => {
  beforeEach(() => {
    store.dispatch = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to CICO screen when cached quote does not exist', () => {
    const props = getMockStackScreenProps(Screens.FiatConnectReviewWrapper, {
      providerId: 'some-provider',
      kycSchema: KycSchema.PersonalDataAndDocuments,
    })
    render(
      <Provider store={store}>
        <FiatConnectReviewScreenWrapper {...props} />
      </Provider>
    )
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchange)
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('navigates to CICO screen on error during re-fetch', () => {
    const store = createMockStore({
      fiatConnect: {
        quotesError: 'some error',
        cachedQuoteParams: {
          'some-provider': {
            [KycSchema.PersonalDataAndDocuments]: {
              cryptoAmount: '10',
              fiatAmount: '10',
              flow: CICOFlow.CashOut,
              cryptoType: Currency.Dollar,
              fiatType: FiatType.USD,
            },
          },
        },
      },
    })
    store.dispatch = jest.fn()
    const props = getMockStackScreenProps(Screens.FiatConnectReviewWrapper, {
      providerId: 'some-provider',
      kycSchema: KycSchema.PersonalDataAndDocuments,
    })
    render(
      <Provider store={store}>
        <FiatConnectReviewScreenWrapper {...props} />
      </Provider>
    )
    expect(navigate).toHaveBeenCalledTimes(1)
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchange)
    expect(store.dispatch).toHaveBeenCalledWith(
      refetchQuote({
        flow: CICOFlow.CashOut,
        cryptoType: Currency.Dollar,
        cryptoAmount: '10',
        providerId: 'some-provider',
      })
    )
  })
  it('dispatches an action and does not navigate on success', () => {
    // N.B: Navigation to the Review screen is handled in the background by the refetchQuote
    // action; testing that the action actually navigates there is beyond the scope of this unit test.
    const store = createMockStore({
      fiatConnect: {
        cachedQuoteParams: {
          'some-provider': {
            [KycSchema.PersonalDataAndDocuments]: {
              cryptoAmount: '10',
              fiatAmount: '10',
              flow: CICOFlow.CashOut,
              cryptoType: Currency.Dollar,
              fiatType: FiatType.USD,
            },
          },
        },
      },
    })
    store.dispatch = jest.fn()
    const props = getMockStackScreenProps(Screens.FiatConnectReviewWrapper, {
      providerId: 'some-provider',
      kycSchema: KycSchema.PersonalDataAndDocuments,
    })
    render(
      <Provider store={store}>
        <FiatConnectReviewScreenWrapper {...props} />
      </Provider>
    )
    expect(navigate).not.toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(
      refetchQuote({
        flow: CICOFlow.CashOut,
        cryptoType: Currency.Dollar,
        cryptoAmount: '10',
        providerId: 'some-provider',
      })
    )
  })
})

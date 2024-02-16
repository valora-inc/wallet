import { FiatType, KycSchema } from '@fiatconnect/fiatconnect-types'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import FiatConnectRefetchQuoteScreen from 'src/fiatconnect/RefetchQuoteScreen'
import { refetchQuote } from 'src/fiatconnect/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockCusdTokenId } from 'test/values'

const store = createMockStore()

describe('RefetchQuoteScreen', () => {
  beforeEach(() => {
    store.dispatch = jest.fn()
  })
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('navigates to CICO start when cached quote does not exist', () => {
    const props = getMockStackScreenProps(Screens.FiatConnectRefetchQuote, {
      providerId: 'some-provider',
      kycSchema: KycSchema.PersonalDataAndDocuments,
    })
    render(
      <Provider store={store}>
        <FiatConnectRefetchQuoteScreen {...props} />
      </Provider>
    )
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(navigateHome).toHaveBeenCalledWith()
    expect(store.dispatch).not.toHaveBeenCalled()
  })

  it('navigates to CICO start on error during quote re-fetch', () => {
    const store = createMockStore({
      fiatConnect: {
        quotesError: 'some error',
        cachedQuoteParams: {
          'some-provider': {
            [KycSchema.PersonalDataAndDocuments]: {
              cryptoAmount: '10',
              fiatAmount: '10',
              flow: CICOFlow.CashOut,
              cryptoType: CiCoCurrency.cUSD,
              fiatType: FiatType.USD,
            },
          },
        },
      },
    })
    store.dispatch = jest.fn()
    const props = getMockStackScreenProps(Screens.FiatConnectRefetchQuote, {
      providerId: 'some-provider',
      kycSchema: KycSchema.PersonalDataAndDocuments,
    })
    render(
      <Provider store={store}>
        <FiatConnectRefetchQuoteScreen {...props} />
      </Provider>
    )
    expect(navigateHome).toHaveBeenCalledTimes(1)
    expect(navigateHome).toHaveBeenCalledWith()
    expect(store.dispatch).toHaveBeenCalledWith(
      refetchQuote({
        flow: CICOFlow.CashOut,
        cryptoType: CiCoCurrency.cUSD,
        cryptoAmount: '10',
        fiatAmount: '10',
        providerId: 'some-provider',
        tokenId: mockCusdTokenId,
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
              cryptoType: CiCoCurrency.cUSD,
              fiatType: FiatType.USD,
            },
          },
        },
      },
    })
    store.dispatch = jest.fn()
    const props = getMockStackScreenProps(Screens.FiatConnectRefetchQuote, {
      providerId: 'some-provider',
      kycSchema: KycSchema.PersonalDataAndDocuments,
    })
    render(
      <Provider store={store}>
        <FiatConnectRefetchQuoteScreen {...props} />
      </Provider>
    )
    expect(navigate).not.toHaveBeenCalled()
    expect(store.dispatch).toHaveBeenCalledWith(
      refetchQuote({
        flow: CICOFlow.CashOut,
        cryptoType: CiCoCurrency.cUSD,
        cryptoAmount: '10',
        fiatAmount: '10',
        providerId: 'some-provider',
        tokenId: mockCusdTokenId,
      })
    )
  })
})

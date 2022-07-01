import { render } from '@testing-library/react-native'
import * as React from 'react'
import {
  CoinbasePaymentSection,
  CoinbasePaymentSectionProps,
} from 'src/fiatExchanges/CoinbasePaymentSection'
import { PaymentMethod } from 'src/fiatExchanges/utils'
import { mockProviders } from 'test/values'

describe('CoinbasePaymentSection', () => {
  let props: CoinbasePaymentSectionProps
  beforeEach(() => {
    props = {
      coinbaseProvider: mockProviders.find(
        (quote) => quote.paymentMethods[0] === PaymentMethod.Coinbase
      )!,
      setNoPaymentMethods: jest.fn(),
    }
  })
  it('shows nothing if unique provider, IE. coinbase, is restricted', async () => {
    props.coinbaseProvider!.restricted = true
    const { queryByText } = render(<CoinbasePaymentSection {...props} />)
    expect(queryByText('Coinbase Pay')).toBeFalsy()
    expect(props.setNoPaymentMethods).toHaveBeenCalledWith(true)
  })
  it('shows a card if unique provider is not restricted', async () => {
    props.coinbaseProvider!.restricted = false
    const { queryByText } = render(<CoinbasePaymentSection {...props} />)
    expect(queryByText('Coinbase Pay')).toBeTruthy()
    expect(props.setNoPaymentMethods).not.toHaveBeenCalled()
  })
})

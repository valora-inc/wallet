import { render } from '@testing-library/react-native'
import * as React from 'react'
import {
  UniquePaymentSection,
  UniquePaymentSectionProps,
} from 'src/fiatExchanges/UniquePaymentSection'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { mockProviders } from 'test/values'

describe('UniquePaymentSection', () => {
  let props: UniquePaymentSectionProps
  beforeEach(() => {
    props = {
      paymentMethod: PaymentMethod.Coinbase,
      uniqueProvider: mockProviders.filter((quote) => quote.paymentMethods[0] === 'Coinbase')[0],
      setNoPaymentMethods: jest.fn(),
      flow: CICOFlow.CashIn,
    }
  })
  it('shows nothing if unique provider, IE. coinbase, is restricted', async () => {
    props.uniqueProvider = null
    const { queryByText } = render(<UniquePaymentSection {...props} />)
    expect(queryByText('selectProviderScreen.coinbase')).toBeFalsy()
  })
  it('shows a card if unique provider is not restricted', async () => {
    const { queryByText } = render(<UniquePaymentSection {...props} />)
    expect(queryByText('selectProviderScreen.coinbase')).toBeTruthy()
  })
})

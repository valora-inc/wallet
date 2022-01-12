import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import SendAmountHeader from 'src/send/SendAmount/SendAmountHeader'
import { createMockStore } from 'test/utils'
import { mockCeloAddress, mockCeurAddress, mockCusdAddress } from 'test/values'

const mockOnChangeToken = jest.fn()

function renderComponent({
  tokenAddress,
  cUsdBalance,
  disallowCurrencyChange = false,
}: {
  tokenAddress: string
  cUsdBalance?: string
  disallowCurrencyChange?: boolean
}) {
  return render(
    <Provider
      store={createMockStore({
        tokens: {
          tokenBalances: {
            [mockCusdAddress]: {
              address: mockCusdAddress,
              symbol: 'cUSD',
              usdPrice: '1',
              balance: cUsdBalance ?? '10',
            },
            [mockCeurAddress]: {
              address: mockCeurAddress,
              symbol: 'cEUR',
              usdPrice: '1.2',
              balance: '20',
            },
            [mockCeloAddress]: {
              address: mockCeloAddress,
              symbol: 'CELO',
              usdPrice: '5',
              balance: '0',
            },
          },
        },
      })}
    >
      <SendAmountHeader
        tokenAddress={tokenAddress}
        isOutgoingPaymentRequest={false}
        isInvite={false}
        onChangeToken={mockOnChangeToken}
        disallowCurrencyChange={disallowCurrencyChange}
      />
    </Provider>
  )
}

describe('SendAmountHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("hides selector and changes title if there's only one token with balance", () => {
    const { queryByTestId, getByText } = renderComponent({
      tokenAddress: mockCeurAddress,
      cUsdBalance: '0',
    })

    expect(queryByTestId('onChangeToken')).toBeNull()
    expect(getByText('sendToken, {"token":"cEUR"}')).toBeDefined()
  })

  it("allows changing the token if there's more than one token with balance", () => {
    const { getByTestId, findByTestId, getByText } = renderComponent({
      tokenAddress: mockCeurAddress,
    })

    const tokenPicker = getByTestId('onChangeToken')
    expect(tokenPicker).not.toBeNull()
    expect(getByText('send')).toBeDefined()

    fireEvent.press(tokenPicker)
    expect(findByTestId('TokenBottomSheetContainer')).toBeTruthy()

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(mockOnChangeToken).toHaveBeenLastCalledWith(mockCusdAddress)
  })
})

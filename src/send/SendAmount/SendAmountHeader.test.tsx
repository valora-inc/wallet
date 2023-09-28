import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import SendAmountHeader from 'src/send/SendAmount/SendAmountHeader'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'

const mockOnChangeToken = jest.fn()

function renderComponent({
  tokenId,
  cUsdBalance,
  disallowCurrencyChange = false,
}: {
  tokenId: string
  cUsdBalance?: string
  disallowCurrencyChange?: boolean
}) {
  return render(
    <Provider
      store={createMockStore({
        tokens: {
          tokenBalances: {
            [mockCusdTokenId]: {
              address: mockCusdAddress,
              tokenId: mockCusdTokenId,
              symbol: 'cUSD',
              priceUsd: '1',
              balance: cUsdBalance ?? '10',
            },
            [mockCeurTokenId]: {
              address: mockCeurAddress,
              tokenId: mockCeurTokenId,
              symbol: 'cEUR',
              priceUsd: '1.2',
              balance: '20',
            },
            [mockCeloTokenId]: {
              address: mockCeloAddress,
              tokenId: mockCeloTokenId,
              symbol: 'CELO',
              priceUsd: '5',
              balance: '0',
            },
          },
        },
      })}
    >
      <SendAmountHeader
        tokenId={tokenId}
        isOutgoingPaymentRequest={false}
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
      tokenId: mockCeurTokenId,
      cUsdBalance: '0',
    })

    expect(queryByTestId('onChangeToken')).toBeNull()
    expect(getByText('sendToken, {"token":"cEUR"}')).toBeDefined()
  })

  it("allows changing the token if there's more than one token with balance", async () => {
    const { getByTestId, getByText } = renderComponent({
      tokenId: mockCeurTokenId,
    })

    const tokenPicker = getByTestId('onChangeToken')
    expect(tokenPicker).not.toBeNull()
    expect(getByText('send')).toBeDefined()

    await act(() => {
      fireEvent.press(tokenPicker)
    })

    await waitFor(() => expect(getByTestId('BottomSheetContainer')).toBeVisible())

    fireEvent.press(getByTestId('cUSDTouchable'))
    expect(mockOnChangeToken).toHaveBeenLastCalledWith(mockCusdTokenId)
  })
})

import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import SendAmountHeader from 'src/send/SendAmount/SendAmountHeader'
import { NetworkId } from 'src/transactions/types'
import { createMockStore } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
} from 'test/values'

jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    ...originalModule,
    __esModule: true,
    default: {
      ...originalModule.default,
      defaultNetworkId: 'celo-alfajores',
    },
  }
})
const mockOnOpenCurrencyPicker = jest.fn()

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
              networkId: NetworkId['celo-alfajores'],
              symbol: 'cUSD',
              priceUsd: '1',
              balance: cUsdBalance ?? '10',
            },
            [mockCeurTokenId]: {
              address: mockCeurAddress,
              tokenId: mockCeurTokenId,
              networkId: NetworkId['celo-alfajores'],
              symbol: 'cEUR',
              priceUsd: '1.2',
              balance: '20',
            },
            [mockCeloTokenId]: {
              address: mockCeloAddress,
              tokenId: mockCeloTokenId,
              networkId: NetworkId['celo-alfajores'],
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
        onOpenCurrencyPicker={mockOnOpenCurrencyPicker}
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

    expect(queryByTestId('TokenPickerSelector')).toBeNull()
    expect(getByText('sendToken, {"token":"cEUR"}')).toBeDefined()
  })

  it("allows changing the token if there's more than one token with balance", async () => {
    const { getByTestId, getByText } = renderComponent({
      tokenId: mockCeurTokenId,
    })

    expect(getByText('send')).toBeDefined()

    fireEvent.press(getByTestId('TokenPickerSelector'))
    expect(mockOnOpenCurrencyPicker).toHaveBeenCalled()
  })
})

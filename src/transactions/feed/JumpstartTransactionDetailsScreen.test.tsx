import { render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-test-renderer'
import { fetchClaimStatus } from 'src/jumpstart/fetchClaimStatus'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams } from 'src/statsig'
import JumpstartTransactionDetailsScreen from 'src/transactions/feed/JumpstartTransactionDetailsScreen'
import {
  Fee,
  NetworkId,
  TokenAmount,
  TokenTransactionTypeV2,
  TokenTransfer,
  TokenTransferMetadata,
  TransactionStatus,
} from 'src/transactions/types'
import { RecursivePartial, createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockCusdAddress, mockCusdTokenId, mockJumpstartAdddress } from 'test/values'
import { encodeFunctionData } from 'viem'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')
jest.mock('src/jumpstart/fetchClaimStatus')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  encodeFunctionData: jest.fn(),
}))

describe('JumpstartTransactionDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(getDynamicConfigParams).mockReturnValue({
      jumpstartContracts: {
        [NetworkId['celo-alfajores']]: { contractAddress: mockJumpstartAdddress },
      },
    })
  })

  function renderScreen({
    transaction,
  }: {
    storeOverrides?: RecursivePartial<RootState>
    transaction: TokenTransfer
  }) {
    const store = createMockStore()

    const mockScreenProps = getMockStackScreenProps(Screens.JumpstartTransactionDetailsScreen, {
      transaction,
    })

    const tree = render(
      <Provider store={store}>
        <JumpstartTransactionDetailsScreen {...mockScreenProps} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  function tokenTransfer({
    type,
    address = mockAccount,
    amount = {
      value: 10,
      tokenAddress: mockCusdAddress,
      tokenId: mockCusdTokenId,
      localAmount: {
        currencyCode: 'EUR',
        exchangeRate: '0.4',
        value: '4',
      },
    },
    metadata = {},
    fees = [],
    status = TransactionStatus.Complete,
  }: {
    type: TokenTransactionTypeV2
    address?: string
    amount?: TokenAmount
    metadata?: TokenTransferMetadata
    fees?: Fee[]
    status?: TransactionStatus
  }): TokenTransfer {
    return {
      __typename: 'TokenTransferV3',
      networkId: NetworkId['celo-alfajores'],
      type,
      transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      timestamp: 1542306118,
      block: '8648978',
      address,
      amount,
      metadata,
      fees,
      status,
    }
  }

  it('handles jumpstart sent transactions correctly', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await waitFor(() =>
      expect(getByTestId('LineItemRowTitle/JumpstartContent/TokenDetails')).toHaveTextContent(
        'amountSent'
      )
    )
    expect(getByTestId('JumpstartContent/AmountValue')).toHaveTextContent('10.00 cUSD')
  })

  it('handles jumpstart received transactions correctly', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
      }),
    })

    await waitFor(() =>
      expect(getByTestId('LineItemRowTitle/JumpstartContent/TokenDetails')).toHaveTextContent(
        'amountReceived'
      )
    )
    expect(getByTestId('JumpstartContent/AmountValue')).toHaveTextContent('10.00 cUSD')
  })

  it(`doesn't show the reclaim button in received transactions`, async () => {
    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
      }),
    })

    await waitFor(() => expect(queryByTestId('JumpstartContent/ReclaimButton')).toBeFalsy())
  })

  it(`shows the disabled button in case of any error`, async () => {
    jest.mocked(fetchClaimStatus).mockRejectedValue(new Error('Test error'))

    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await waitFor(() => expect(getByTestId('JumpstartContent/ReclaimButton')).toBeDisabled())
  })

  it(`shows the enabled button if the funds were not yet claimed`, async () => {
    jest.mocked(encodeFunctionData).mockReturnValue('0xabc')
    jest.mocked(fetchClaimStatus).mockResolvedValue({
      beneficiary: mockAccount,
      index: 0,
      claimed: false,
    })

    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await waitFor(() => expect(getByTestId('JumpstartContent/ReclaimButton')).toBeEnabled())
    expect(getByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('reclaim')
  })

  it('shows a disabled button with the claimed text if the funds were already claimed', async () => {
    jest.mocked(fetchClaimStatus).mockResolvedValue({
      beneficiary: mockAccount,
      index: 0,
      claimed: true,
    })

    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await act(() => {
      jest.runAllTimers()
    })

    await waitFor(() =>
      expect(getByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('claimed')
    )
    expect(getByTestId('JumpstartContent/ReclaimButton')).toBeDisabled()
  })
})

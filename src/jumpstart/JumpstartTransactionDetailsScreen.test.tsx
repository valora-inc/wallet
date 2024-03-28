import { fireEvent, render, waitFor } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import JumpstartTransactionDetailsScreen from 'src/jumpstart/JumpstartTransactionDetailsScreen'
import { fetchClaimStatus } from 'src/jumpstart/fetchClaimStatus'
import { jumpstartReclaimErrorDismissed, jumpstartReclaimStarted } from 'src/jumpstart/slice'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { getDynamicConfigParams } from 'src/statsig'
import {
  Fee,
  NetworkId,
  TokenAmount,
  TokenTransactionTypeV2,
  TokenTransfer,
  TokenTransferMetadata,
  TransactionStatus,
} from 'src/transactions/types'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { RecursivePartial, createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount,
  mockCeloTokenBalance,
  mockCusdAddress,
  mockCusdTokenId,
  mockJumpstartAdddress,
} from 'test/values'
import { encodeFunctionData } from 'viem'

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')
jest.mock('src/jumpstart/fetchClaimStatus')
jest.mock('src/viem/prepareTransactions')
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  encodeFunctionData: jest.fn(),
}))

const mockReclaimTx: TransactionRequest = {
  from: '0xfrom',
  to: '0xto',
  data: '0xdata',
  gas: BigInt(500),
  maxFeePerGas: BigInt(1),
  maxPriorityFeePerGas: undefined,
}

describe('JumpstartTransactionDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.mocked(getDynamicConfigParams).mockReturnValue({
      jumpstartContracts: {
        [NetworkId['celo-alfajores']]: { contractAddress: mockJumpstartAdddress },
      },
    })
    jest.mocked(prepareTransactions).mockResolvedValue({
      type: 'possible',
      transactions: [mockReclaimTx],
      feeCurrency: mockCeloTokenBalance,
    })
  })

  function renderScreen({
    transaction,
    storeOverrides,
  }: {
    storeOverrides?: RecursivePartial<RootState>
    transaction: TokenTransfer
  }) {
    const store = createMockStore(storeOverrides)

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
    address = mockJumpstartAdddress,
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

  it('shows the correct amount for jumpstart sent transactions', async () => {
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

  it('shows the correct amount and no reclaim button for jumpstart received transactions', async () => {
    const { getByTestId, queryByTestId } = renderScreen({
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
    expect(queryByTestId('JumpstartContent/ReclaimButton')).toBeFalsy()
  })

  it(`shows the disabled reclaim button and an error toast in case of any error`, async () => {
    jest.mocked(fetchClaimStatus).mockRejectedValue(new Error('Test error'))

    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await waitFor(() => expect(getByTestId('JumpstartContent/ReclaimButton')).toBeDisabled())
    expect(getByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('reclaim')
    expect(getByTestId('JumpstartContent/ErrorNotification/FetchReclaimStatus')).toBeTruthy()
  })

  it(`shows the enabled reclaim button if the funds were not yet claimed`, async () => {
    jest.mocked(encodeFunctionData).mockReturnValue('0xabc')
    jest.mocked(fetchClaimStatus).mockResolvedValue({
      beneficiary: mockAccount,
      index: 0,
      claimed: false,
    })

    const { getByTestId, queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await waitFor(() => expect(getByTestId('JumpstartContent/ReclaimButton')).toBeEnabled())
    expect(getByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('reclaim')
    expect(queryByTestId('JumpstartContent/ErrorNotification/FetchReclaimStatus')).toBeFalsy()
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

    await waitFor(() =>
      expect(getByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('claimed')
    )
    expect(getByTestId('JumpstartContent/ReclaimButton')).toBeDisabled()
  })

  it('dispatches the correct action on reclaim', async () => {
    jest.mocked(fetchClaimStatus).mockResolvedValue({
      beneficiary: mockAccount,
      index: 0,
      claimed: false,
    })
    const mockTransaction = tokenTransfer({
      type: TokenTransactionTypeV2.Sent,
    })
    const { findByText, store } = renderScreen({
      transaction: mockTransaction,
    })

    const confirmReclaimButton = await findByText('confirm')
    fireEvent.press(confirmReclaimButton)

    expect(store.getActions()).toEqual([
      jumpstartReclaimStarted({
        reclaimTx: getSerializablePreparedTransaction(mockReclaimTx),
        networkId: mockTransaction.networkId,
        tokenAmount: mockTransaction.amount,
      }),
    ])
  })

  it('shows an error if the reclaim failed', async () => {
    jest.mocked(fetchClaimStatus).mockResolvedValue({
      beneficiary: mockAccount,
      index: 0,
      claimed: false,
    })
    const mockTransaction = tokenTransfer({
      type: TokenTransactionTypeV2.Sent,
    })
    const { getByTestId, queryByTestId, rerender, getByText, store } = renderScreen({
      transaction: mockTransaction,
      storeOverrides: {
        jumpstart: {
          reclaimStatus: 'error',
        },
      },
    })

    await waitFor(() =>
      expect(getByTestId('JumpstartContent/ErrorNotification/Reclaim')).toBeTruthy()
    )

    fireEvent.press(getByText('dismiss'))
    expect(store.getActions()).toEqual([jumpstartReclaimErrorDismissed()])

    const updatedStore = createMockStore({
      jumpstart: {
        reclaimStatus: 'loading',
      },
    })
    rerender(
      <Provider store={updatedStore}>
        <JumpstartTransactionDetailsScreen
          {...getMockStackScreenProps(Screens.JumpstartTransactionDetailsScreen, {
            transaction: mockTransaction,
          })}
        />
      </Provider>
    )

    await waitFor(() =>
      expect(queryByTestId('JumpstartContent/ErrorNotification/Reclaim')).toBeFalsy()
    )
  })
})

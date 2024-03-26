import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { act } from 'react-test-renderer'
import { JumpstartEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
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
import { prepareTransactions } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import {
  RecursivePartial,
  createMockStore,
  getElementText,
  getMockStackScreenProps,
} from 'test/utils'
import {
  mockAccount,
  mockAccountInvite,
  mockCeloTokenBalance,
  mockCusdAddress,
  mockCusdTokenId,
  mockJumpstartAdddress,
} from 'test/values'

const mockTransaction: any = jest.fn()

jest.mock('src/analytics/ValoraAnalytics')
jest.mock('src/statsig')
jest.mock('src/jumpstart/fetchClaimStatus')
jest.mock('src/viem/prepareTransactions')
jest.mock('src/viem/preparedTransactionSerialization')

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

  it('handles jumpstart sent transactions correctly', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    const amountSendComponent = getByTestId('LineItemRowTitle/JumpstartContent/TokenDetails')
    expect(getElementText(amountSendComponent)).toBe('amountSent')
    const amountValue = getByTestId('JumpstartContent/AmountValue')
    expect(getElementText(amountValue)).toBe('10.00 cUSD')
  })

  it('handles jumpstart received transactions correctly', async () => {
    const { getByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
      }),
    })

    const amountReceivedComponent = getByTestId('LineItemRowTitle/JumpstartContent/TokenDetails')
    expect(getElementText(amountReceivedComponent)).toBe('amountReceived')
    const amountValue = getByTestId('JumpstartContent/AmountValue')
    expect(getElementText(amountValue)).toBe('10.00 cUSD')
  })

  it(`doesn't show the button in received transactions`, async () => {
    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Received,
      }),
    })

    expect(queryByTestId('JumpstartContent/ReclaimButton')).toBeFalsy()
  })

  it(`shows the disabled button in case of any error`, async () => {
    jest.mocked(fetchClaimStatus).mockImplementation(() => {
      throw new Error('Test error')
    })

    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await act(() => {
      jest.runAllTimers()
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_reclaim_fetching_error,
      {
        networkId: NetworkId['celo-alfajores'],
        transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      }
    )

    expect(queryByTestId('JumpstartContent/ReclaimButton')).toBeDisabled()
  })

  it(`shows the enabled button if the escrow wasn't claimed`, async () => {
    jest.mocked(fetchClaimStatus).mockImplementation(async () => {
      return {
        beneficiary: mockAccountInvite,
        index: 0,
        claimed: false,
      }
    })
    jest.mocked(prepareTransactions).mockImplementation(async () => ({
      type: 'possible',
      transactions: [mockTransaction],
      feeCurrency: mockCeloTokenBalance,
    }))
    jest.mocked(getSerializablePreparedTransaction).mockImplementation(() => mockTransaction)

    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await act(() => {
      jest.runAllTimers()
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_reclaim_fetching_success,
      {
        claimed: false,
        networkId: NetworkId['celo-alfajores'],
        transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      }
    )

    expect(queryByTestId('JumpstartContent/ReclaimButton')).toBeEnabled()
    expect(queryByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('reclaim')
  })

  it('shows a disabled button with the claimed text if the escrow was already claimed', async () => {
    jest.mocked(fetchClaimStatus).mockImplementation(async () => {
      return {
        beneficiary: mockAccount,
        index: 0,
        claimed: true,
      }
    })

    const { queryByTestId } = renderScreen({
      transaction: tokenTransfer({
        type: TokenTransactionTypeV2.Sent,
      }),
    })

    await act(() => {
      jest.runAllTimers()
    })

    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_reclaim_fetching_success,
      {
        claimed: true,
        networkId: NetworkId['celo-alfajores'],
        transactionHash: '0x544367eaf2b01622dd1c7b75a6b19bf278d72127aecfb2e5106424c40c268e8b',
      }
    )

    expect(queryByTestId('JumpstartContent/ReclaimButton')).toBeDisabled()
    expect(queryByTestId('JumpstartContent/ReclaimButton')).toHaveTextContent('claimed')
  })
})

import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SendOrigin } from 'src/analytics/types'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import SendConfirmation from 'src/send/SendConfirmation'
import { encryptComment, sendPayment } from 'src/send/actions'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { RecursivePartial, createMockStore, getMockStackScreenProps } from 'test/utils'
import {
  emptyFees,
  mockAccount,
  mockAccount2,
  mockAccount3,
  mockAddressRecipient,
  mockCeloAddress,
  mockCeloTokenBalance,
  mockCeloTokenId,
  mockCusdAddress,
  mockCusdTokenBalance,
  mockCusdTokenId,
  mockE164Number,
  mockPoofAddress,
  mockPoofTokenId,
  mockRecipient,
  mockTokenBalances,
  mockTokenTransactionData,
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
jest.mock('src/send/usePrepareSendTransactions')

const mockScreenProps = getMockStackScreenProps(Screens.SendConfirmation, {
  transactionData: {
    ...mockTokenTransactionData,
  },
  origin: SendOrigin.AppSendFlow,
  isFromScan: false,
})

const mockFeeCurrencies = [
  { ...mockCeloTokenBalance, priceUsd: new BigNumber('5'), lastKnownPriceUsd: new BigNumber('5') },
  mockCusdTokenBalance,
]

const mockPrepareTransactionsResultPossible: PreparedTransactionsPossible = {
  type: 'possible',
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt('1'.concat('0'.repeat(16))), // 0.01 CELO
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
      _baseFeePerGas: BigInt(1),
    },
  ],
  feeCurrency: mockFeeCurrencies[0],
}

type ScreenProps = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>

describe('SendConfirmation', () => {
  let mockUsePrepareSendTransactionsOutput: ReturnType<typeof usePrepareSendTransactions>

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUsePrepareSendTransactionsOutput = {
      prepareTransactionsResult: mockPrepareTransactionsResultPossible,
      refreshPreparedTransactions: jest.fn(),
      clearPreparedTransactions: jest.fn(),
      prepareTransactionError: undefined,
    }
    jest.mocked(usePrepareSendTransactions).mockReturnValue(mockUsePrepareSendTransactionsOutput)
  })

  function renderScreen(
    storeOverrides: RecursivePartial<RootState> = {},
    screenProps?: ScreenProps
  ) {
    const store = createMockStore({
      tokens: {
        tokenBalances: {
          [mockPoofTokenId]: mockTokenBalances[mockPoofTokenId],
          [mockCeloTokenId]: { ...mockTokenBalances[mockCeloTokenId], balance: '5', priceUsd: '5' },
          [mockCusdTokenId]: mockTokenBalances[mockCusdTokenId],
        },
      },
      ...storeOverrides,
    })

    const tree = render(
      <Provider store={store}>
        <SendConfirmation {...(screenProps ? screenProps : mockScreenProps)} />
      </Provider>
    )

    return {
      store,
      ...tree,
    }
  }

  it('renders correctly', async () => {
    const tree = renderScreen()
    expect(tree).toMatchSnapshot()
  })

  it('prepares a transaction on load', () => {
    renderScreen()
    expect(mockUsePrepareSendTransactionsOutput.clearPreparedTransactions).toHaveBeenCalledWith()
    jest.advanceTimersByTime(300)
    expect(mockUsePrepareSendTransactionsOutput.refreshPreparedTransactions).toHaveBeenCalledTimes(
      1
    )
    expect(mockUsePrepareSendTransactionsOutput.refreshPreparedTransactions).toHaveBeenCalledWith({
      amount: mockTokenTransactionData.tokenAmount,
      token: mockCusdTokenBalance,
      recipientAddress: mockTokenTransactionData.recipient.address,
      walletAddress: mockAccount.toLowerCase(),
      feeCurrencies: mockFeeCurrencies,
      comment: undefined,
    })
  })

  it('doesnt show the comment for CELO', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockCeloAddress,
          tokenId: mockCeloTokenId,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('doesnt show the comment for non core tokens', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockPoofAddress,
          tokenId: mockPoofTokenId,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeFalsy()
  })

  it('shows comment when stable token on celo network', () => {
    const { queryByTestId } = renderScreen(
      {},
      getMockStackScreenProps(Screens.SendConfirmation, {
        transactionData: {
          ...mockTokenTransactionData,
          tokenAddress: mockCusdAddress,
        },
        origin: SendOrigin.AppSendFlow,
        isFromScan: false,
      })
    )

    expect(queryByTestId('commentInput/send')).toBeTruthy()
  })

  it('updates comment and then encrypts and prepares a tx with encrypted comment', () => {
    const { getByTestId, queryAllByDisplayValue, store } = renderScreen({
      send: { encryptedComment: 'enc-comment' },
    })
    jest.advanceTimersByTime(300)
    expect(mockUsePrepareSendTransactionsOutput.refreshPreparedTransactions).toHaveBeenCalledTimes(
      1
    )
    expect(mockUsePrepareSendTransactionsOutput.refreshPreparedTransactions).toHaveBeenCalledWith({
      amount: mockTokenTransactionData.tokenAmount,
      token: mockCusdTokenBalance,
      recipientAddress: mockTokenTransactionData.recipient.address,
      walletAddress: mockAccount.toLowerCase(),
      feeCurrencies: mockFeeCurrencies,
      comment: undefined, // no comment entered yet
    })
    const input = getByTestId('commentInput/send')
    const comment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(queryAllByDisplayValue(comment)).toHaveLength(1)
    jest.advanceTimersByTime(300)
    expect(store.getActions()).toEqual([
      encryptComment({
        comment: '', // empty comment dispatched first
        fromAddress: mockAccount.toLowerCase(),
        toAddress: mockTokenTransactionData.recipient.address,
      }),
      encryptComment({
        comment,
        fromAddress: mockAccount.toLowerCase(),
        toAddress: mockTokenTransactionData.recipient.address,
      }),
    ])
    expect(mockUsePrepareSendTransactionsOutput.refreshPreparedTransactions).toHaveBeenCalledTimes(
      2
    )
    expect(mockUsePrepareSendTransactionsOutput.refreshPreparedTransactions).toHaveBeenCalledWith({
      amount: mockTokenTransactionData.tokenAmount,
      token: mockCusdTokenBalance,
      recipientAddress: mockTokenTransactionData.recipient.address,
      walletAddress: mockAccount.toLowerCase(),
      feeCurrencies: mockFeeCurrencies,
      comment: 'enc-comment',
    })
  })

  it('disables send if transaction is not prepared yet', () => {
    mockUsePrepareSendTransactionsOutput.prepareTransactionsResult = undefined
    const { getByTestId } = renderScreen()

    expect(getByTestId('ConfirmButton')).toBeDisabled()
  })

  it('dispatches an action with prepared transaction when the confirm button is pressed', async () => {
    const { store, getByTestId } = renderScreen({ fees: { estimates: emptyFees } }, mockScreenProps)

    expect(store.getActions().length).toEqual(0)

    fireEvent.press(getByTestId('ConfirmButton'))

    const { inputAmount, tokenId, recipient } = mockTokenTransactionData

    expect(store.getActions()[0]).toEqual(
      sendPayment(
        inputAmount,
        tokenId,
        inputAmount.times(1.001),
        '',
        recipient,
        false,
        undefined,
        getSerializablePreparedTransaction(mockPrepareTransactionsResultPossible.transactions[0])
      )
    )
  })

  it('trims comment when encrypting and sending', () => {
    const { getByTestId, queryAllByDisplayValue, store } = renderScreen()
    const input = getByTestId('commentInput/send')
    const comment = '   A comment!   '
    const trimmedComment = 'A comment!'
    fireEvent.changeText(input, comment)
    expect(queryAllByDisplayValue(comment)).toHaveLength(1)
    jest.advanceTimersByTime(300)
    fireEvent.press(getByTestId('ConfirmButton'))
    const { inputAmount, tokenId, recipient } = mockTokenTransactionData
    expect(store.getActions()).toEqual([
      encryptComment({
        comment: trimmedComment,
        fromAddress: mockAccount.toLowerCase(),
        toAddress: mockTokenTransactionData.recipient.address,
      }),
      sendPayment(
        inputAmount,
        tokenId,
        inputAmount.times(1.001),
        trimmedComment,
        recipient,
        false,
        undefined,
        getSerializablePreparedTransaction(mockPrepareTransactionsResultPossible.transactions[0])
      ),
    ])
  })

  it('renders address for phone recipients with multiple addresses', () => {
    const screenProps = getMockStackScreenProps(Screens.SendConfirmation, {
      transactionData: {
        ...mockTokenTransactionData,
        recipient: mockRecipient, // recipient that includes a PN
      },
      origin: SendOrigin.AppSendFlow,
      isFromScan: false,
    })
    const { getByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: {
            [mockE164Number]: [mockAccount3, mockAccount2],
          },
        },
      },
      screenProps
    )

    expect(getByTestId('RecipientAddress')).toBeTruthy()
  })

  it.each([
    { testSuffix: 'non phone number recipients', recipient: mockAddressRecipient },
    { testSuffix: 'phone number recipient with one address', recipient: mockRecipient },
  ])('does not render address for $testSuffix', ({ recipient }) => {
    const screenProps = getMockStackScreenProps(Screens.SendConfirmation, {
      transactionData: {
        ...mockTokenTransactionData,
        recipient,
      },
      origin: SendOrigin.AppSendFlow,
      isFromScan: false,
    })
    const { queryByTestId } = renderScreen(
      {
        identity: {
          e164NumberToAddress: {
            [mockE164Number]: [mockAccount3],
          },
        },
      },
      screenProps
    )

    expect(queryByTestId('RecipientAddress')).toBeFalsy()
  })
})

import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents } from 'src/analytics/Events'
import { createJumpstartLink } from 'src/firebase/dynamicLinks'
import JumpstartEnterAmount from 'src/jumpstart/JumpstartEnterAmount'
import { depositTransactionFlowStarted, jumpstartIntroSeen } from 'src/jumpstart/slice'
import { usePrepareJumpstartTransactions } from 'src/jumpstart/usePrepareJumpstartTransactions'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getDynamicConfigParams } from 'src/statsig'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
import { TransactionRequest } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockCeloTokenId,
  mockCeurTokenId,
  mockCusdTokenId,
  mockPoofTokenId,
  mockTokenBalances,
  mockUSDCTokenId,
} from 'test/values'

jest.mock('src/statsig')
jest.mock('src/jumpstart/usePrepareJumpstartTransactions')
jest.mock('viem/accounts', () => ({
  ...jest.requireActual('viem/accounts'),
  generatePrivateKey: jest
    .fn()
    .mockReturnValue('0x859c770be6bada3b0ae071d5368afaf9eb445584b35d914771dbf351db1e3df3'),
}))
jest.mock('src/firebase/dynamicLinks')

const mockPublicKey = '0x2CEc3C5e83eE37261F9f9BB050B2Fbf59d13eEc0' // matches mock private key
const mockStoreBalancesToTokenBalances = (storeBalances: StoredTokenBalance[]): TokenBalance[] => {
  return storeBalances.map(
    (token): TokenBalance => ({
      ...token,
      balance: new BigNumber(token.balance ?? 0),
      priceUsd: new BigNumber(token.priceUsd ?? 0),
      lastKnownPriceUsd: token.priceUsd ? new BigNumber(token.priceUsd) : null,
    })
  )
}
const tokenBalances = {
  [mockCeloTokenId]: { ...mockTokenBalances[mockCeloTokenId], address: null }, // filtered out for no address
  [mockCusdTokenId]: { ...mockTokenBalances[mockCusdTokenId], balance: '10' },
  [mockUSDCTokenId]: mockTokenBalances[mockUSDCTokenId], // filtered out for networkId
  [mockPoofTokenId]: { ...mockTokenBalances[mockPoofTokenId], balance: '0' }, // filtered out for no balance
  [mockCeurTokenId]: { ...mockTokenBalances[mockCeurTokenId], balance: '100' },
}
const feeCurrencies = [
  tokenBalances[mockCeloTokenId],
  tokenBalances[mockCeurTokenId],
  tokenBalances[mockCusdTokenId],
]
const store = createMockStore({
  tokens: {
    tokenBalances,
  },
  jumpstart: {
    introHasBeenSeen: true,
  },
})

const executeSpy = jest.fn()
const mockTransactions: TransactionRequest[] = [
  {
    from: '0xfrom',
    to: '0xto',
    data: '0xdata',
    gas: BigInt(5e15), // 0.005 CELO
    maxFeePerGas: BigInt(1),
    maxPriorityFeePerGas: undefined,
    _baseFeePerGas: BigInt(1),
  },
]
jest.mocked(usePrepareJumpstartTransactions).mockReturnValue({
  execute: executeSpy,
  reset: jest.fn(),
  loading: false,
  result: {
    type: 'possible',
    transactions: mockTransactions,
    feeCurrency: tokenBalances[mockCeloTokenId],
  },
  error: undefined,
  status: 'not-requested',
} as any)

describe('JumpstartEnterAmount', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDynamicConfigParams).mockReturnValue({
      jumpstartContracts: {
        'celo-alfajores': {
          contractAddress: '0xjumpstart',
        },
      },
      maxAllowedSendAmountUsd: 50,
    })
    store.clearActions()
  })

  it('should render only jumpstart tokens', () => {
    const { getAllByTestId } = render(
      <Provider store={store}>
        <JumpstartEnterAmount />
      </Provider>
    )

    const tokens = getAllByTestId('TokenBalanceItem')
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toHaveTextContent('cEUR')
    expect(tokens[1]).toHaveTextContent('cUSD')
  })

  it('should prepare transactions with the expected inputs', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <JumpstartEnterAmount />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '.25')

    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(1))
    expect(executeSpy).toHaveBeenCalledWith({
      sendTokenAmountInSmallestUnit: new BigNumber('250000000000000000'),
      token: mockStoreBalancesToTokenBalances([tokenBalances[mockCeurTokenId]])[0],
      walletAddress: mockAccount.toLowerCase(),
      publicKey: mockPublicKey,
      feeCurrencies: mockStoreBalancesToTokenBalances(feeCurrencies),
    })
  })

  it('should show a blocking warning if the send amount exceeds the threshold', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <Provider store={store}>
        <JumpstartEnterAmount />
      </Provider>
    )

    // default selected token is cEUR, priceUsd: '1.16' so max send amount will be 50 / 1.16 = 43.10
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '43.5')

    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(1))
    expect(getByText('review')).toBeDisabled()
    expect(
      getByText(
        'jumpstartEnterAmountScreen.maxAmountWarning.title, {"amountInLocalCurrency":"66.5","formatParams":{"amountInLocalCurrency":{"currency":"PHP","locale":"es-419"}}}'
      )
    ).toBeTruthy()
    expect(getByText('jumpstartEnterAmountScreen.maxAmountWarning.description')).toBeTruthy()

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '43')

    await waitFor(() => expect(getByText('review')).not.toBeDisabled())
    expect(queryByText('jumpstartEnterAmountScreen.maxAmountWarning.title')).toBeFalsy()
  })

  it('should navigate to the next screen on tap continue', async () => {
    const mockLink = 'https://vlra.app/abc123'
    jest.mocked(createJumpstartLink).mockResolvedValue(mockLink)

    const { getByTestId, getByText } = render(
      <Provider store={store}>
        <JumpstartEnterAmount />
      </Provider>
    )

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '.25')

    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(1))
    fireEvent.press(getByText('review'))

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(Screens.JumpstartSendConfirmation, {
        link: mockLink,
        sendAmount: '0.25',
        tokenId: mockCeurTokenId,
        serializablePreparedTransactions: getSerializablePreparedTransactions(mockTransactions),
        beneficiaryAddress: mockPublicKey,
      })
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      JumpstartEvents.jumpstart_send_amount_continue,
      {
        amountInUsd: '0.29',
        localCurrency: 'PHP',
        localCurrencyExchangeRate: '1.33',
        networkId: 'celo-alfajores',
        tokenAmount: '0.25',
        tokenId: mockCeurTokenId,
        tokenSymbol: 'cEUR',
        amountEnteredIn: 'token',
      }
    )
  })

  it('should block the continue button if there is an in-flight jumpstart transaction', async () => {
    const { getByTestId, rerender } = render(
      <Provider store={store}>
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(store.getActions()).toEqual([depositTransactionFlowStarted()])

    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '.25')
    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(1))
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeEnabled()

    const updatedStore = createMockStore({
      tokens: {
        tokenBalances,
      },
      jumpstart: {
        depositStatus: 'success',
        introHasBeenSeen: true,
      },
    })
    rerender(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    // depositTransactionFlowStarted should not be dispatched
    expect(updatedStore.getActions()).toEqual([])
    fireEvent.changeText(getByTestId('SendEnterAmount/TokenAmountInput'), '.30')
    // prepare transaction for a second time on this screen
    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(2))
    // review button should remain disabled
    expect(getByTestId('SendEnterAmount/ReviewButton')).toBeDisabled()
  })

  it('should render the add assets flow if the user has no jumpstart tokens', () => {
    const { getByText, getByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {},
          },
        })}
      >
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.noFundsHint')).toBeTruthy()
    expect(getByText('jumpstartIntro.addFundsCelo.cta')).toBeTruthy()
    expect(getByTestId('JumpstartIntro/noFundsButton')).toBeTruthy()
  })

  it('should show intro screen when user visits jumpstart for the first time', async () => {
    const { getByText, getByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: { tokenBalances },
          jumpstart: { introHasBeenSeen: false },
        })}
      >
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.haveFundsButton')).toBeTruthy()
    expect(getByTestId('JumpstartEnterAmount/haveFundsButton')).toBeTruthy()
  })

  it('should track in analytics when user sees intro for the first time', async () => {
    const updatedStore = createMockStore({
      tokens: { tokenBalances },
      jumpstart: { introHasBeenSeen: false },
    })

    const { getByText, getByTestId, rerender } = render(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.haveFundsButton')).toBeTruthy()
    expect(getByTestId('JumpstartEnterAmount/haveFundsButton')).toBeTruthy()
    expect(AppAnalytics.track).toHaveBeenCalledWith(JumpstartEvents.jumpstart_intro_seen)

    rerender(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(AppAnalytics.track).toBeCalledTimes(1)
  })

  it('should show intro screen every time until user clicks cta', async () => {
    const updatedStore = createMockStore({
      tokens: { tokenBalances },
      jumpstart: { introHasBeenSeen: false },
    })

    const { getByText, getByTestId, rerender } = render(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.haveFundsButton')).toBeTruthy()
    expect(getByTestId('JumpstartEnterAmount/haveFundsButton')).toBeTruthy()

    rerender(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    // do not expect for jumpstartIntroSeen() to run
    expect(updatedStore.getActions()).toEqual([depositTransactionFlowStarted()])

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.haveFundsButton')).toBeTruthy()
    expect(getByTestId('JumpstartEnterAmount/haveFundsButton')).toBeTruthy()
  })

  it('should proceed to enter amount screen once the intro is seen', async () => {
    let updatedStore = createMockStore({
      tokens: { tokenBalances },
      jumpstart: { introHasBeenSeen: false },
    })

    const { getByText, getByTestId, rerender } = render(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(getByText('jumpstartIntro.title')).toBeTruthy()
    expect(getByText('jumpstartIntro.description')).toBeTruthy()
    expect(getByText('jumpstartIntro.haveFundsButton')).toBeTruthy()
    expect(getByTestId('JumpstartEnterAmount/haveFundsButton')).toBeTruthy()

    fireEvent.press(getByTestId('JumpstartEnterAmount/haveFundsButton'))
    expect(updatedStore.getActions()).toEqual([
      depositTransactionFlowStarted(),
      jumpstartIntroSeen(),
    ])

    updatedStore = createMockStore({
      tokens: { tokenBalances },
      jumpstart: { introHasBeenSeen: true },
    })

    rerender(
      <Provider store={updatedStore}>
        <JumpstartEnterAmount />
      </Provider>
    )

    expect(getByTestId('SendEnterAmount/TokenAmountInput')).toBeTruthy()
  })
})

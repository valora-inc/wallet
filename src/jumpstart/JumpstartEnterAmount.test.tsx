import { fireEvent, render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import JumpstartEnterAmount from 'src/jumpstart/JumpstartEnterAmount'
import { usePrepareJumpstartTransactions } from 'src/jumpstart/usePrepareJumpstartTransactions'
import { getDynamicConfigParams } from 'src/statsig'
import { StoredTokenBalance, TokenBalance } from 'src/tokens/slice'
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
})

const executeSpy = jest.fn()
jest.mocked(usePrepareJumpstartTransactions).mockReturnValue({
  execute: executeSpy,
  reset: jest.fn(),
  loading: false,
  result: {
    type: 'possible',
    transactions: [
      {
        from: '0xfrom',
        to: '0xto',
        data: '0xdata',
        gas: BigInt(5e15), // 0.005 CELO
        maxFeePerGas: BigInt(1),
        maxPriorityFeePerGas: undefined,
        _baseFeePerGas: BigInt(1),
      },
    ],
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

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '.25')

    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(1))
    expect(executeSpy).toHaveBeenCalledWith({
      amount: new BigNumber('0.25'),
      token: mockStoreBalancesToTokenBalances([tokenBalances[mockCeurTokenId]])[0],
      walletAddress: mockAccount.toLowerCase(),
      publicKey: '0x2CEc3C5e83eE37261F9f9BB050B2Fbf59d13eEc0', // matches mock private key
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
    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '43.5')

    await waitFor(() => expect(executeSpy).toHaveBeenCalledTimes(1))
    expect(getByText('review')).toBeDisabled()
    expect(getByText('jumpstartEnterAmountScreen.maxAmountWarning.title')).toBeTruthy()
    expect(
      getByText(
        'jumpstartEnterAmountScreen.maxAmountWarning.description, {"maxAmount":"66.50","localCurrencyCode":"PHP"}'
      )
    ).toBeTruthy()

    fireEvent.changeText(getByTestId('SendEnterAmount/Input'), '43')

    await waitFor(() => expect(getByText('review')).not.toBeDisabled())
    expect(queryByText('jumpstartEnterAmountScreen.maxAmountWarning.title')).toBeFalsy()
  })
})

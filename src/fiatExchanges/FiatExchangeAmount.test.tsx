import { FiatAccountSchema, FiatAccountType, FiatType } from '@fiatconnect/fiatconnect-types'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import FiatExchangeAmount from 'src/fiatExchanges/FiatExchangeAmount'
import { attemptReturnUserFlow } from 'src/fiatconnect/slice'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { useTokenInfo } from 'src/tokens/hooks'
import { Network, NetworkId } from 'src/transactions/types'
import { CiCoCurrency } from 'src/utils/currencies'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import {
  mockCeloAddress,
  mockCeloTokenId,
  mockCeurAddress,
  mockCeurTokenId,
  mockCusdAddress,
  mockCusdTokenId,
  mockEthTokenId,
  mockMaxSendAmount,
} from 'test/values'
import { CICOFlow } from './utils'

const mockUseMaxSendAmount = jest.fn(() => mockMaxSendAmount)
const mockTokenInfoPartial = {
  balance: new BigNumber(1),
  priceUsd: new BigNumber(1),
  lastKnownPriceUsd: new BigNumber(1),
  decimals: 1,
  name: 'mockName',
  networkId: NetworkId['celo-alfajores'],
}
jest.mock('src/fees/hooks', () => ({
  useMaxSendAmountByAddress: () => mockUseMaxSendAmount(),
}))
jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
}))
jest.mock('src/web3/networkConfig', () => {
  const originalModule = jest.requireActual('src/web3/networkConfig')
  return {
    __esModule: true,
    ...originalModule,
    default: {
      ...originalModule.default,
      networkToNetworkId: {
        celo: 'celo-alfajores',
        ethereum: 'ethereuim-sepolia',
      },
      defaultNetworkId: 'celo-alfajores',
    },
  }
})
jest.mock('src/tokens/hooks', () => ({
  ...jest.requireActual('src/tokens/hooks'),
  useTokenInfo: jest.fn(),
}))

const usdToUsdRate = '1'
const usdToEurRate = '0.862'
const usdToPhpRate = '50'

const mockTokens = {
  tokenBalances: {
    [mockCusdTokenId]: {
      address: mockCusdAddress,
      tokenId: mockCusdTokenId,
      networkId: NetworkId['celo-alfajores'],
      symbol: 'cUSD',
      balance: '200',
      priceUsd: '1',
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
    [mockCeurTokenId]: {
      address: mockCeurAddress,
      tokenId: mockCeurTokenId,
      networkId: NetworkId['celo-alfajores'],
      symbol: 'cEUR',
      balance: '100',
      priceUsd: '1.2',
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
    [mockCeloTokenId]: {
      address: mockCeloAddress,
      tokenId: mockCeloTokenId,
      networkId: NetworkId['celo-alfajores'],
      symbol: 'CELO',
      balance: '200',
      priceUsd: '5',
      isCoreToken: true,
      priceFetchedAt: Date.now(),
    },
  },
}

const storeWithUSD = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.USD,
    preferredCurrencyCode: LocalCurrencyCode.USD,
    usdToLocalRate: usdToUsdRate,
  },
  tokens: mockTokens,
})

const storeWithEUR = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.EUR,
    preferredCurrencyCode: LocalCurrencyCode.EUR,
    usdToLocalRate: usdToEurRate,
  },
  tokens: mockTokens,
})

const storeWithPHP = createMockStore({
  localCurrency: {
    fetchedCurrencyCode: LocalCurrencyCode.PHP,
    preferredCurrencyCode: LocalCurrencyCode.PHP,
    usdToLocalRate: usdToPhpRate,
  },
  tokens: mockTokens,
})

describe('FiatExchangeAmount cashIn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
  })

  it.each([
    { currency: CiCoCurrency.cUSD, tokenId: mockCusdTokenId, network: Network.Celo },
    { currency: CiCoCurrency.cEUR, tokenId: mockCeurTokenId, network: Network.Celo },
    { currency: CiCoCurrency.ETH, tokenId: mockEthTokenId, network: Network.Ethereum },
  ])(`disables the next button if the $currency amount is 0`, ({ tokenId, currency }) => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: 'mockAddress',
        symbol: currency,
        tokenId: tokenId,
      })
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      tokenId,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton')).toBeDisabled()
  })

  it.each([
    {
      currency: CiCoCurrency.cUSD,
      tokenId: mockCusdTokenId,
      network: Network.Celo,
      store: storeWithUSD,
    },
    {
      currency: CiCoCurrency.cEUR,
      tokenId: mockCeurTokenId,
      network: Network.Celo,
      store: storeWithPHP,
    },
    {
      currency: CiCoCurrency.ETH,
      tokenId: mockEthTokenId,
      network: Network.Ethereum,
      store: storeWithUSD,
    },
  ])(
    `enables the next button if the $currency amount is greater than 0`,
    ({ tokenId, currency, store }) => {
      jest
        .mocked(useTokenInfo)
        .mockReturnValue({
          ...mockTokenInfoPartial,
          address: 'mockAddress',
          symbol: currency,
          tokenId: tokenId,
        })
      const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
        tokenId,
        flow: CICOFlow.CashIn,
      })
      const tree = render(
        <Provider store={store}>
          <FiatExchangeAmount {...mockScreenProps} />
        </Provider>
      )

      fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '5')
      expect(tree.getByTestId('FiatExchangeNextButton')).not.toBeDisabled()
    }
  )

  it('renders correctly with USD as app currency', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly with EUR as app currency', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashIn,
    })
    const tree = render(
      <Provider store={storeWithEUR}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})

describe('FiatExchangeAmount cashOut', () => {
  const mockScreenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    tokenId: mockCusdTokenId,
    flow: CICOFlow.CashOut,
  })

  const mockScreenPropsEuro = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    tokenId: mockCeurTokenId,
    flow: CICOFlow.CashOut,
  })

  const mockScreenPropsCelo = getMockStackScreenProps(Screens.FiatExchangeAmount, {
    tokenId: mockCeloTokenId,
    flow: CICOFlow.CashOut,
  })

  beforeEach(() => {
    jest.clearAllMocks()
    storeWithUSD.clearActions()
    storeWithPHP.clearActions()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('displays correctly for cUSD when local currency is USD', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(getByText('amount (cUSD)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('celoDollar @ $1.00')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
    expect(getByText('disclaimerFiat, {"currency":"celoDollar"}')).toBeTruthy()
  })

  it('displays correctly for cEUR when local currency is USD', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        priceUsd: new BigNumber(1.2),
        address: mockCeurAddress,
        symbol: 'cEUR',
        tokenId: mockCeurTokenId,
      })
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsEuro} />
      </Provider>
    )
    expect(getByText('amount (cEUR)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('celoEuro @ $1.20')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
    expect(getByText('disclaimerFiat, {"currency":"celoEuro"}')).toBeTruthy()
  })

  it('displays correctly for CELO when local currency is USD', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        priceUsd: new BigNumber(5),
        address: mockCeloAddress,
        symbol: 'CELO',
        tokenId: mockCeloTokenId,
      })
    const { getByText, getByTestId } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenPropsCelo} />
      </Provider>
    )
    expect(getByText('amount (CELO)')).toBeTruthy()
    expect(getElementText(getByTestId('LineItemRowTitle/subtotal'))).toBe('subtotal @ $5.00')
    expect(getElementText(getByTestId('LineItemRow/subtotal'))).toBe('$0.00')
  })

  it('displays correctly when the SHOW_RECEIVE_AMOUNT_IN_SELECT_PROVIDER feature flag is on', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    jest.mocked(getFeatureGate).mockReturnValue(true)
    const { getByText, queryByTestId, queryByText } = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )
    expect(getByText('amount (cUSD)')).toBeTruthy()
    expect(queryByTestId('LineItemRowTitle/subtotal')).toBeFalsy()
    expect(queryByTestId('LineItemRow/subtotal')).toBeFalsy()
    expect(queryByText('disclaimerFiat, {"currency":"celoDollar"}')).toBeFalsy()
  })

  it('disables the next button if the cUSD amount is 0', () => {
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '0')
    expect(tree.getByTestId('FiatExchangeNextButton')).toBeDisabled()
  })

  it('shows an error banner if the user balance is less than the requested cash-out amount', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '1001')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(storeWithUSD.getActions()).toEqual(
      expect.arrayContaining([
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, undefined, {
          balance: '1000.00',
          currency: 'cUSD',
        }),
      ])
    )
  })

  it('shows an error banner if the user balance minus estimated transaction fee is less than the requested cash-out amount', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '999.99999')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(storeWithUSD.getActions()).toEqual(
      expect.arrayContaining([
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, undefined, {
          balance: '1000.00',
          currency: 'cUSD',
        }),
      ])
    )
  })

  it('navigates to the SelectProvider if the user balance is greater than the requested cash-out amount', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const tree = render(
      <Provider store={storeWithUSD}>
        <FiatExchangeAmount {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '750')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.SelectProvider, {
      flow: CICOFlow.CashOut,
      amount: {
        fiat: 750,
        crypto: 750,
      },
      tokenId: mockCusdTokenId,
    })
  })
  it('calls dispatch attemptReturnUserFlow when there is a previously linked fiatconnect account', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const store = createMockStore({
      localCurrency: {
        fetchedCurrencyCode: LocalCurrencyCode.USD,
        preferredCurrencyCode: LocalCurrencyCode.USD,
        usdToLocalRate: usdToUsdRate,
      },
      fiatConnect: {
        cachedFiatAccountUses: [
          {
            providerId: 'provider-two',
            fiatAccountId: '123',
            fiatAccountType: FiatAccountType.BankAccount,
            flow: CICOFlow.CashOut,
            cryptoType: CiCoCurrency.cUSD,
            fiatType: FiatType.USD,
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
          },
        ],
      },
    })
    store.dispatch = jest.fn()
    const screenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashOut,
    })
    const tree = render(
      <Provider store={store}>
        <FiatExchangeAmount {...screenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '750')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(store.dispatch).toHaveBeenLastCalledWith(
      attemptReturnUserFlow({
        flow: CICOFlow.CashOut,
        selectedCrypto: CiCoCurrency.cUSD,
        amount: {
          crypto: 750,
          fiat: 750,
        },
        providerId: 'provider-two',
        fiatAccountId: '123',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
      })
    )
  })
  it('calls dispatch attemptReturnUserFlow when there is a previously linked fiatconnect account that used a different flow', () => {
    jest
      .mocked(useTokenInfo)
      .mockReturnValue({
        ...mockTokenInfoPartial,
        address: mockCusdAddress,
        symbol: 'cUSD',
        tokenId: mockCusdTokenId,
      })
    const store = createMockStore({
      localCurrency: {
        fetchedCurrencyCode: LocalCurrencyCode.USD,
        preferredCurrencyCode: LocalCurrencyCode.USD,
        usdToLocalRate: usdToUsdRate,
      },
      fiatConnect: {
        cachedFiatAccountUses: [
          {
            providerId: 'provider-two',
            fiatAccountId: '123',
            fiatAccountType: FiatAccountType.BankAccount,
            flow: CICOFlow.CashIn,
            cryptoType: CiCoCurrency.cUSD,
            fiatType: FiatType.USD,
            fiatAccountSchema: FiatAccountSchema.AccountNumber,
          },
        ],
      },
    })
    store.dispatch = jest.fn()
    const screenProps = getMockStackScreenProps(Screens.FiatExchangeAmount, {
      tokenId: mockCusdTokenId,
      flow: CICOFlow.CashOut,
    })
    const tree = render(
      <Provider store={store}>
        <FiatExchangeAmount {...screenProps} />
      </Provider>
    )

    fireEvent.changeText(tree.getByTestId('FiatExchangeInput'), '750')
    fireEvent.press(tree.getByTestId('FiatExchangeNextButton'))
    expect(store.dispatch).toHaveBeenLastCalledWith(
      attemptReturnUserFlow({
        flow: CICOFlow.CashOut,
        selectedCrypto: CiCoCurrency.cUSD,
        amount: {
          crypto: 750,
          fiat: 750,
        },
        providerId: 'provider-two',
        fiatAccountId: '123',
        fiatAccountType: FiatAccountType.BankAccount,
        fiatAccountSchema: FiatAccountSchema.AccountNumber,
      })
    )
  })
})

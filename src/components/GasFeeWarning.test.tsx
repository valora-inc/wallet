import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { FeeEvents } from 'src/analytics/Events'
import GasFeeWarning from 'src/components/GasFeeWarning'
import { NetworkId } from 'src/transactions/types'
import {
  PreparedTransactionsNeedDecreaseSpendAmountForGas,
  PreparedTransactionsNotEnoughBalanceForGas,
  PreparedTransactionsPossible,
} from 'src/viem/prepareTransactions'
import { createMockStore } from 'test/utils'
import { mockArbEthTokenId, mockCeloTokenId, mockTokenBalances } from 'test/values'

const mockPreparedTransactionPossible: PreparedTransactionsPossible = {
  type: 'possible' as const,
  transactions: [],
  feeCurrency: {
    ...mockTokenBalances[mockArbEthTokenId],
    isNative: true,
    balance: new BigNumber(10),
    priceUsd: new BigNumber(1),
    lastKnownPriceUsd: new BigNumber(1),
  },
}

const mockPreparedTransactionNotEnoughCelo: PreparedTransactionsNotEnoughBalanceForGas = {
  type: 'not-enough-balance-for-gas' as const,
  feeCurrencies: [
    {
      ...mockTokenBalances[mockCeloTokenId],
      isNative: true,
      balance: new BigNumber(0),
      priceUsd: new BigNumber(1500),
      lastKnownPriceUsd: new BigNumber(1500),
    },
  ],
}

const mockPreparedTransactionNeedDecreaseEth: PreparedTransactionsNeedDecreaseSpendAmountForGas = {
  type: 'need-decrease-spend-amount-for-gas' as const,
  feeCurrency: {
    ...mockTokenBalances[mockArbEthTokenId],
    isNative: true,
    balance: new BigNumber(0),
    priceUsd: new BigNumber(1500),
    lastKnownPriceUsd: new BigNumber(1500),
  },
  maxGasFeeInDecimal: new BigNumber(1),
  estimatedGasFeeInDecimal: new BigNumber(1),
  decreasedSpendAmount: new BigNumber(1),
}

describe('GasFeeWarning', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it('should return null if prepareTransactionsResult is undefined', () => {
    const store = createMockStore()
    const { queryByTestId } = render(
      <Provider store={store}>
        <GasFeeWarning flow={'Send'} />
      </Provider>
    )
    expect(queryByTestId('GasFeeWarning')).toBeFalsy()
  })
  it('should return null if prepareTransactionsResult.type is possible', () => {
    const store = createMockStore()
    const { queryByTestId } = render(
      <Provider store={store}>
        <GasFeeWarning flow={'Send'} prepareTransactionsResult={mockPreparedTransactionPossible} />
      </Provider>
    )
    expect(queryByTestId('GasFeeWarning')).toBeFalsy()
  })
  it.each`
    scenario                                     | flow          | prepareTransactionsResult                 | feeCurrencyTokenId   | title                                                                 | description                                                                         | ctaLabel
    ${'sending max amount of ETH'}               | ${'Send'}     | ${mockPreparedTransactionNeedDecreaseEth} | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"context":"Send","tokenSymbol":"ETH"}'}      | ${'gasFeeWarning.descriptionMaxAmount, {"context":"Send","tokenSymbol":"ETH"}'}     | ${'gasFeeWarning.ctaAction, {"context":"Send"}'}
    ${'sending with insufficient CELO'}          | ${'Send'}     | ${mockPreparedTransactionNotEnoughCelo}   | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"context":"Send","tokenSymbol":"CELO"}'}     | ${undefined}                                                                        | ${'gasFeeWarning.ctaBuy, {"tokenSymbol":"CELO"}'}
    ${'swapping max amount of ETH'}              | ${'Swap'}     | ${mockPreparedTransactionNeedDecreaseEth} | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"context":"Swap","tokenSymbol":"ETH"}'}      | ${'gasFeeWarning.descriptionMaxAmount, {"context":"Swap","tokenSymbol":"ETH"}'}     | ${'gasFeeWarning.ctaAction, {"context":"Swap"}'}
    ${'swapping with insufficient CELO'}         | ${'Swap'}     | ${mockPreparedTransactionNotEnoughCelo}   | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"context":"Swap","tokenSymbol":"CELO"}'}     | ${undefined}                                                                        | ${'gasFeeWarning.ctaBuy, {"tokenSymbol":"CELO"}'}
    ${'withdrawing max amount of ETH'}           | ${'Withdraw'} | ${mockPreparedTransactionNeedDecreaseEth} | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"context":"Withdraw","tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionMaxAmount, {"context":"Withdraw","tokenSymbol":"ETH"}'} | ${'gasFeeWarning.ctaAction, {"context":"Withdraw"}'}
    ${'withdrawing with insufficient CELO'}      | ${'Withdraw'} | ${mockPreparedTransactionNotEnoughCelo}   | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"context":"Withdraw","tokenSymbol":"CELO"}'} | ${undefined}                                                                        | ${'gasFeeWarning.ctaBuy, {"tokenSymbol":"CELO"}'}
    ${'depositing max amount of ETH'}            | ${'Deposit'}  | ${mockPreparedTransactionNeedDecreaseEth} | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"context":"Deposit","tokenSymbol":"ETH"}'}   | ${'gasFeeWarning.descriptionMaxAmount, {"context":"Deposit","tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.ctaAction, {"context":"Deposit"}'}
    ${'depositing with insufficient CELO'}       | ${'Deposit'}  | ${mockPreparedTransactionNotEnoughCelo}   | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"context":"Deposit","tokenSymbol":"CELO"}'}  | ${undefined}                                                                        | ${'gasFeeWarning.ctaBuy, {"tokenSymbol":"CELO"}'}
    ${'dapp transaction with max amount of ETH'} | ${'Dapp'}     | ${mockPreparedTransactionNeedDecreaseEth} | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"context":"Dapp","tokenSymbol":"ETH"}'}      | ${'gasFeeWarning.descriptionDapp, {"tokenSymbol":"ETH"}'}                           | ${undefined}
    ${'dapp transaction with insufficient CELO'} | ${'Dapp'}     | ${mockPreparedTransactionNotEnoughCelo}   | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"context":"Dapp","tokenSymbol":"CELO"}'}     | ${'gasFeeWarning.descriptionDapp, {"tokenSymbol":"CELO"}'}                          | ${undefined}
  `(
    'renders error correctly when $scenario',
    ({ flow, prepareTransactionsResult, feeCurrencyTokenId, title, description, ctaLabel }) => {
      const store = createMockStore()
      const onPressSmallerAmount = jest.fn()
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <GasFeeWarning
            flow={flow}
            prepareTransactionsResult={prepareTransactionsResult}
            onPressSmallerAmount={onPressSmallerAmount}
          />
        </Provider>
      )
      expect(getByTestId('GasFeeWarning')).toBeTruthy()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(FeeEvents.gas_fee_warning_impression, {
        flow,
        errorType: prepareTransactionsResult.type,
        tokenId: feeCurrencyTokenId,
        networkId:
          feeCurrencyTokenId === mockArbEthTokenId
            ? NetworkId['arbitrum-sepolia']
            : NetworkId['celo-alfajores'],
      })
      expect(getByText(title)).toBeTruthy()
      expect(description ? getByText(description) : true).toBeTruthy()
      expect(ctaLabel ? getByText(ctaLabel) : true).toBeTruthy()
      if (ctaLabel) {
        fireEvent.press(getByText(ctaLabel))
      }
      expect(onPressSmallerAmount).toHaveBeenCalledTimes(
        ctaLabel && ctaLabel.includes('ctaAction') ? 1 : 0
      )
    }
  )
})

import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AppEvents } from 'src/analytics/Events'
import GasFeeWarning, { GasFeeWarningFlow } from 'src/components/GasFeeWarning'
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

const mockPreparedTransactionNeedDecreaseCelo: PreparedTransactionsNeedDecreaseSpendAmountForGas = {
  type: 'need-decrease-spend-amount-for-gas' as const,
  feeCurrency: {
    ...mockTokenBalances[mockCeloTokenId],
    isNative: true,
    balance: new BigNumber(0),
    priceUsd: new BigNumber(1500),
    lastKnownPriceUsd: new BigNumber(1500),
  },
  maxGasFeeInDecimal: new BigNumber(1),
  estimatedGasFeeInDecimal: new BigNumber(1),
  decreasedSpendAmount: new BigNumber(1),
}

const mockPreparedTransactionNotEnoughEth: PreparedTransactionsNotEnoughBalanceForGas = {
  type: 'not-enough-balance-for-gas' as const,
  feeCurrencies: [
    {
      ...mockTokenBalances[mockArbEthTokenId],
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
        <GasFeeWarning flow={GasFeeWarningFlow.Send} testIdPrefix={'test'} />
      </Provider>
    )
    expect(queryByTestId('test/GasFeeWarning')).toBeNull()
  })
  it('should return null if prepareTransactionsResult.type is possible', () => {
    const store = createMockStore()
    const { queryByTestId } = render(
      <Provider store={store}>
        <GasFeeWarning
          flow={GasFeeWarningFlow.Send}
          testIdPrefix={'test'}
          prepareTransactionsResult={mockPreparedTransactionPossible}
        />
      </Provider>
    )
    expect(queryByTestId('test/GasFeeWarning')).toBeNull()
  })
  it.each`
    scenario                                      | flow                          | prepareTransactionsResult                  | feeCurrencyTokenId   | title                                            | description                                                                    | ctaLabel
    // SENDING CASES
    ${'sending max amount of CELO'}               | ${GasFeeWarningFlow.Send}     | ${mockPreparedTransactionNeedDecreaseCelo} | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionMaxAmount.sending, {"tokenSymbol":"CELO"}'}        | ${'gasFeeWarning.ctaGasToken.send'}
    ${'sending max amount of ETH'}                | ${GasFeeWarningFlow.Send}     | ${mockPreparedTransactionNeedDecreaseEth}  | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionMaxAmount.sending, {"tokenSymbol":"ETH"}'}         | ${'gasFeeWarning.ctaGasToken.send}'}
    ${'sending with insufficient CELO'}           | ${GasFeeWarningFlow.Send}     | ${mockPreparedTransactionNotEnoughCelo}    | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionNotEnoughGas.sending, {"tokenSymbol":"CELO"}'}     | ${'gasFeeWarning.cta, {"tokenSymbol":"CELO"}'}
    ${'sending with insufficient ETH'}            | ${GasFeeWarningFlow.Send}     | ${mockPreparedTransactionNotEnoughEth}     | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionNotEnoughGas.sending, {"tokenSymbol":"ETH"}'}      | ${'gasFeeWarning.cta, {"tokenSymbol":"ETH"}'}
    ${'swapping max amount of CELO'}              | ${GasFeeWarningFlow.Swap}     | ${mockPreparedTransactionNeedDecreaseCelo} | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionMaxAmount.swapping, {"tokenSymbol":"CELO"}'}       | ${'gasFeeWarning.ctaGasToken.swap}'}
    ${'swapping max amount of ETH'}               | ${GasFeeWarningFlow.Swap}     | ${mockPreparedTransactionNeedDecreaseEth}  | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionMaxAmount.swapping, {"tokenSymbol":"ETH"}'}        | ${'gasFeeWarning.ctaGasToken.swap}'}
    ${'swapping with insufficient CELO'}          | ${GasFeeWarningFlow.Swap}     | ${mockPreparedTransactionNotEnoughCelo}    | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionNotEnoughGas.swapping, {"tokenSymbol":"CELO"}'}    | ${'gasFeeWarning.cta, {"tokenSymbol":"CELO"}'}
    ${'swapping with insufficient ETH'}           | ${GasFeeWarningFlow.Swap}     | ${mockPreparedTransactionNotEnoughEth}     | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionNotEnoughGas.swapping, {"tokenSymbol":"ETH"}'}     | ${'gasFeeWarning.cta, {"tokenSymbol":"ETH"}'}
    ${'withdrawing max amount of CELO'}           | ${GasFeeWarningFlow.Withdraw} | ${mockPreparedTransactionNeedDecreaseCelo} | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionMaxAmount.withdrawing, {"tokenSymbol":"CELO"}'}    | ${'gasFeeWarning.ctaGasToken.withdraw}'}
    ${'withdrawing max amount of ETH'}            | ${GasFeeWarningFlow.Withdraw} | ${mockPreparedTransactionNeedDecreaseEth}  | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionMaxAmount.withdrawing, {"tokenSymbol":"ETH"}'}     | ${'gasFeeWarning.ctaGasToken.withdraw}'}
    ${'withdrawing with insufficient CELO'}       | ${GasFeeWarningFlow.Withdraw} | ${mockPreparedTransactionNotEnoughCelo}    | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionNotEnoughGas.withdrawing, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.cta, {"tokenSymbol":"CELO"}'}
    ${'withdrawing with insufficient ETH'}        | ${GasFeeWarningFlow.Withdraw} | ${mockPreparedTransactionNotEnoughEth}     | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionNotEnoughGas.withdrawing, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.cta, {"tokenSymbol":"ETH"}'}
    ${'depositing max amount of CELO'}            | ${GasFeeWarningFlow.Deposit}  | ${mockPreparedTransactionNeedDecreaseCelo} | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionMaxAmount.depositing, {"tokenSymbol":"CELO"}'}     | ${'gasFeeWarning.ctaGasToken.deposit}'}
    ${'depositing max amount of ETH'}             | ${GasFeeWarningFlow.Deposit}  | ${mockPreparedTransactionNeedDecreaseEth}  | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionMaxAmount.depositing, {"tokenSymbol":"ETH"}'}      | ${'gasFeeWarning.ctaGasToken.deposit}'}
    ${'depositing with insufficient CELO'}        | ${GasFeeWarningFlow.Deposit}  | ${mockPreparedTransactionNotEnoughCelo}    | ${mockCeloTokenId}   | ${'gasFeeWarning.title, {"tokenSymbol":"CELO"}'} | ${'gasFeeWarning.descriptionNotEnoughGas.depositing, {"tokenSymbol":"CELO"}'}  | ${'gasFeeWarning.cta, {"tokenSymbol":"CELO"}'}
    ${'depositing with insufficient ETH'}         | ${GasFeeWarningFlow.Deposit}  | ${mockPreparedTransactionNotEnoughEth}     | ${mockArbEthTokenId} | ${'gasFeeWarning.title, {"tokenSymbol":"ETH"}'}  | ${'gasFeeWarning.descriptionNotEnoughGas.depositing, {"tokenSymbol":"ETH"}'}   | ${'gasFeeWarning.cta, {"tokenSymbol":"ETH"}'}
    ${'dapp transaction with max amount of CELO'} | ${GasFeeWarningFlow.Dapp}     | ${mockPreparedTransactionNeedDecreaseCelo} | ${mockCeloTokenId}   | ${'gasFeeWarning.titleDapp'}                     | ${'gasFeeWarning.descriptionDapp, {"tokenSymbol":"CELO"}'}                     | ${undefined}
    ${'dapp transaction with max amount of ETH'}  | ${GasFeeWarningFlow.Dapp}     | ${mockPreparedTransactionNeedDecreaseEth}  | ${mockArbEthTokenId} | ${'gasFeeWarning.titleDapp'}                     | ${'gasFeeWarning.descriptionDapp, {"tokenSymbol":"ETH"}'}                      | ${undefined}
    ${'dapp transaction with insufficient CELO'}  | ${GasFeeWarningFlow.Dapp}     | ${mockPreparedTransactionNotEnoughCelo}    | ${mockCeloTokenId}   | ${'gasFeeWarning.titleDapp'}                     | ${'gasFeeWarning.descriptionDapp, {"tokenSymbol":"CELO"}'}                     | ${undefined}
    ${'dapp transaction with insufficient ETH'}   | ${GasFeeWarningFlow.Dapp}     | ${mockPreparedTransactionNotEnoughEth}     | ${mockArbEthTokenId} | ${'gasFeeWarning.titleDapp'}                     | ${'gasFeeWarning.descriptionDapp, {"tokenSymbol":"ETH"}'}                      | ${undefined}
  `(
    'renders error correctly when $scenario',
    ({ flow, prepareTransactionsResult, feeCurrencyTokenId, title, description, ctaLabel }) => {
      const store = createMockStore()
      const onPressCta = jest.fn()
      const { getByTestId, getByText } = render(
        <Provider store={store}>
          <GasFeeWarning
            flow={flow}
            testIdPrefix={'test'}
            prepareTransactionsResult={prepareTransactionsResult}
            onPressCta={ctaLabel ? onPressCta : undefined}
          />
        </Provider>
      )
      expect(getByTestId('test/GasFeeWarning')).toBeTruthy()
      expect(AppAnalytics.track).toHaveBeenCalledTimes(1)
      expect(AppAnalytics.track).toHaveBeenCalledWith(AppEvents.show_gas_fee_warning, {
        flow,
        errorType: prepareTransactionsResult.type,
        tokenId: feeCurrencyTokenId,
      })
      expect(getByText(title)).toBeTruthy()
      expect(getByText(description)).toBeTruthy()
      if (ctaLabel) {
        fireEvent.press(getByText(ctaLabel))
      }
      expect(ctaLabel ? getByText(ctaLabel) : true).toBeTruthy()
      expect(onPressCta).toHaveBeenCalledTimes(ctaLabel ? 1 : 0)
    }
  )
})

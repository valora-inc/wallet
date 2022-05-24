import { CeloTransactionObject } from '@celo/connect'
import { StableToken } from '@celo/contractkit'
import { ExchangeWrapper } from '@celo/contractkit/lib/wrappers/Exchange'
import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { ReserveWrapper } from '@celo/contractkit/lib/wrappers/Reserve'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { CELO_AMOUNT_FOR_ESTIMATE, DOLLAR_AMOUNT_FOR_ESTIMATE } from '@celo/utils/lib/celoHistory'
import BigNumber from 'bignumber.js'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'redux-saga/effects'
import { showError, showErrorOrFallback } from 'src/alert/actions'
import { CeloExchangeEvents, FeeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import {
  Actions,
  ExchangeTokensAction,
  FetchExchangeRateAction,
  FetchSymmetricRateAction,
  FetchTobinTaxAction,
  setExchangeRate,
  setTobinTax,
  WithdrawCeloAction,
  withdrawCeloCanceled,
  withdrawCeloFailed,
  withdrawCeloSuccess,
} from 'src/exchange/actions'
import { ExchangeRates, exchangeRatesSelector } from 'src/exchange/reducer'
import { currencyToFeeCurrency } from 'src/fees/saga'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { sendPaymentOrInviteSuccess } from 'src/send/actions'
import {
  convertToContractDecimals,
  createTokenTransferTransaction,
  getCurrencyAddress,
  getTokenContract,
} from 'src/tokens/saga'
import { celoAddressSelector } from 'src/tokens/selectors'
import {
  addStandbyTransaction,
  addStandbyTransactionLegacy,
  removeStandbyTransaction,
} from 'src/transactions/actions'
import { sendAndMonitorTransaction } from 'src/transactions/saga'
import { sendTransaction } from 'src/transactions/send'
import {
  newTransactionContext,
  TokenTransactionTypeV2,
  TransactionContext,
  TransactionStatus,
} from 'src/transactions/types'
import { CURRENCIES, Currency, StableCurrency, STABLE_CURRENCIES } from 'src/utils/currencies'
import {
  getRateForMakerToken,
  getTakerAmount,
  goldToDollarAmount,
} from 'src/utils/currencyExchange'
import { roundDown } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { getContractKit, getContractKitAsync } from 'src/web3/contracts'
import { getConnectedAccount, getConnectedUnlockedAccount } from 'src/web3/saga'
import { getLatestNonce } from 'src/web3/utils'
import * as util from 'util'

const TAG = 'exchange/saga'

const EXCHANGE_DIFFERENCE_PERCENT_TOLERATED = 0.01 // Maximum % difference between actual and displayed takerAmount

export function* doFetchTobinTax({ makerAmount, makerToken }: FetchTobinTaxAction) {
  try {
    let tobinTax
    if (makerToken === Currency.Celo) {
      yield call(getConnectedAccount)

      const contractKit = yield call(getContractKit)
      const reserve: ReserveWrapper = yield call([
        contractKit.contracts,
        contractKit.contracts.getReserve,
      ])

      const tobinTaxFraction = yield call(reserve.getOrComputeTobinTax().txo.call)

      if (!tobinTaxFraction) {
        Logger.debug(TAG, 'Unable to fetch tobin tax')
        throw new Error('Unable to fetch tobin tax')
      }

      // Tobin tax represents % tax on gold transfer, stored as fraction tuple
      tobinTax = tobinTaxFraction['0'] / tobinTaxFraction['1']
      if (tobinTax > 0) {
        tobinTax = makerAmount.times(tobinTax).toString()
      }
    } else {
      // Tobin tax only charged for gold transfers
      tobinTax = 0
    }

    Logger.debug(TAG, `Retrieved Tobin tax rate: ${tobinTax}`)
    yield put(setTobinTax(tobinTax.toString()))
  } catch (error) {
    ValoraAnalytics.track(FeeEvents.fetch_tobin_tax_failed, { error: error.message })
    Logger.error(TAG, 'Error fetching Tobin tax', error)
    yield put(showError(ErrorMessages.CALCULATE_FEE_FAILED))
  }
}

export async function getExchangeContract(token: StableCurrency) {
  // @todo Update this function to get exchange contracts from Symmetric DEX
  Logger.debug(TAG + '@getTokenContract', `Fetching contract for ${token}`)
  const contractKit = await getContractKitAsync(false)
  switch (token) {
    case Currency.Dollar:
      return contractKit.contracts.getExchange(StableToken.cUSD)
    case Currency.Euro:
      return contractKit.contracts.getExchange(StableToken.cEUR)
    default:
      throw new Error(`Could not fetch contract for unknown token ${token}`)
  }
}

/**
 * Get the contract from the Symmetric Exchange to use for the given asset pair.
 * @todo This function should query the symmetric DEx for the exchange contract
 * @param assetIn Asset to convert from
 * @param assetOut Asset to convert to
 */
export async function getSymmetricContract(assetIn: Currency, assetOut: Currency) {
  if (assetIn == null) throw new Error('Input Asset is undefined.')
  if (assetOut == null) throw new Error('Output Asset is undefined.')
  Logger.debug(TAG, '@getSymmetricContract', `Fetching contract for ${assetIn} and ${assetOut}`)

  throw new Error(`Could not fetch contract for unknown pair (${assetIn}, ${assetOut})`)
}

export function* doFetchExchangeRate(action: FetchExchangeRateAction) {
  Logger.debug(TAG, 'Calling @doFetchExchangeRate')

  const { makerToken, makerAmount } = action
  try {
    ValoraAnalytics.track(CeloExchangeEvents.celo_fetch_exchange_rate_start)
    yield call(getConnectedAccount)

    let makerAmountInWei: BigNumber | null = null
    if (makerAmount && makerToken) {
      makerAmountInWei = ((yield call(
        convertToContractDecimals,
        makerAmount,
        makerToken
      )) as BigNumber).integerValue()
    }

    // If makerAmount and makerToken are given, use them to estimate the exchange rate,
    // as exchange rate depends on amount sold. Else default to preset large sell amount.
    const sellAmounts: Record<Currency, BigNumber> = Object.keys(CURRENCIES).reduce(
      (amounts, currency) => {
        amounts[currency as Currency] =
          makerAmountInWei && !makerAmountInWei.isZero() && makerToken === currency
            ? makerAmountInWei
            : currency === Currency.Celo
            ? CELO_AMOUNT_FOR_ESTIMATE
            : DOLLAR_AMOUNT_FOR_ESTIMATE
        return amounts
      },
      {} as Record<Currency, BigNumber>
    )

    const exchangeContracts: ExchangeWrapper[] = yield all(
      STABLE_CURRENCIES.map((currency: StableCurrency) => call(getExchangeContract, currency))
    )

    const exchangeRates: Record<Currency, Record<Currency, string>> = Object.keys(
      CURRENCIES
    ).reduce((rates, currency) => {
      rates[currency as Currency] = {
        // Empty strings will be replaced by real values before dispatching to the store or an error will be thrown.
        [Currency.Celo]: '',
        [Currency.Euro]: '',
        [Currency.Dollar]: '',
      }
      return rates
    }, {} as Record<Currency, Record<Currency, string>>)

    // TODO: Consider making all the fetches for exchange rates in parallel to reduce the time this loop takes.
    for (let i = 0; i < STABLE_CURRENCIES.length; i++) {
      const stableCurrency = STABLE_CURRENCIES[i]
      const exchange = exchangeContracts[i]
      const [stableSellExchangeRate, celoSellExchangeRate]: [BigNumber, BigNumber] = yield all([
        call([exchange, exchange.getStableExchangeRate], sellAmounts[stableCurrency]),
        call([exchange, exchange.getGoldExchangeRate], sellAmounts[Currency.Celo]),
      ])

      if (!stableSellExchangeRate || !celoSellExchangeRate) {
        const errorMessage = `Invalid exchange rates between ${stableCurrency} and CELO`
        Logger.debug(TAG, errorMessage)
        throw new Error(errorMessage)
      }

      Logger.debug(
        TAG,
        `Retrieved exchange rate:
        ${stableSellExchangeRate.toString()} CELO per ${stableCurrency}, estimated at ${
          sellAmounts[stableCurrency]
        }
        ${celoSellExchangeRate.toString()} ${stableCurrency} per CELO, estimated at ${
          sellAmounts[Currency.Celo]
        }`
      )

      exchangeRates[stableCurrency][Currency.Celo] = stableSellExchangeRate.toString()
      exchangeRates[Currency.Celo][stableCurrency] = celoSellExchangeRate.toString()

      // Always tracking in stable currency for consistancy
      ValoraAnalytics.track(CeloExchangeEvents.celo_fetch_exchange_rate_complete, {
        currency: stableCurrency,
        makerAmount: sellAmounts[stableCurrency].toNumber(),
        exchangeRate: stableSellExchangeRate.toNumber(),
      })
    }

    yield put(setExchangeRate(exchangeRates))
  } catch (error) {
    ValoraAnalytics.track(CeloExchangeEvents.celo_fetch_exchange_rate_error, {
      error: error.message,
    })
    Logger.error(TAG, 'Error fetching exchange rate', error)
    yield put(showError(ErrorMessages.EXCHANGE_RATE_FAILED))
  }
}

// @todo Query Symmetric DEx contracts for exchange rates
export function* doFetchSymmetricRate(action: FetchSymmetricRateAction) {
  Logger.debug(TAG, '@doFetchSymmetricRate', 'Fetching exchange rate')
  throw new Error('Not implemented')
  yield
}

export function* exchangeGoldAndStableTokens(action: ExchangeTokensAction) {
  Logger.debug(`${TAG}@exchangeGoldAndStableTokens`, 'Exchanging gold and stable token')
  const { makerToken, makerAmount, takerToken } = action
  Logger.debug(TAG, `Exchanging ${makerAmount.toString()} of token ${makerToken}`)
  let context: TransactionContext | null = null
  try {
    ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_start)
    const account: string = yield call(getConnectedUnlockedAccount)
    navigate(Screens.ExchangeHomeScreen)

    const exchangeRates: ExchangeRates = yield select(exchangeRatesSelector)
    const exchangeRate = getRateForMakerToken(exchangeRates, makerToken, takerToken)
    if (!exchangeRate) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: 'Invalid exchange rate from exchange contract',
      })
      Logger.error(TAG, 'Invalid exchange rate from exchange contract')
      return
    }
    if (exchangeRate.isZero()) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: 'Cannot do exchange with rate of 0',
      })
      Logger.debug(TAG, 'Cannot do exchange with rate of 0. Stopping.')
      throw new Error('Invalid exchange rate')
    }

    context = yield call(createStandbyTx, makerToken, makerAmount, takerToken, exchangeRate)

    const contractKit = yield call(getContractKit)
    const stableToken = (makerToken === Currency.Celo ? takerToken : makerToken) as StableCurrency

    const goldTokenContract: GoldTokenWrapper = yield call([
      contractKit.contracts,
      contractKit.contracts.getGoldToken,
    ])
    const stableTokenContract: StableTokenWrapper = yield call(getTokenContract, stableToken)
    const exchangeContract: ExchangeWrapper = yield call(getExchangeContract, stableToken)

    const convertedMakerAmount: BigNumber = roundDown(
      yield call(convertToContractDecimals, makerAmount, makerToken),
      0
    ) // Nearest integer in wei
    const sellGold = makerToken === Currency.Celo

    const updatedExchangeRate: BigNumber = yield call(
      // Updating with actual makerAmount, rather than conservative estimate displayed
      [exchangeContract, exchangeContract.getExchangeRate],
      convertedMakerAmount,
      sellGold
    )

    const exceedsExpectedSize =
      makerToken === Currency.Celo
        ? convertedMakerAmount.isGreaterThan(CELO_AMOUNT_FOR_ESTIMATE)
        : convertedMakerAmount.isGreaterThan(DOLLAR_AMOUNT_FOR_ESTIMATE)

    if (exceedsExpectedSize) {
      Logger.warn(
        TAG,
        `Displayed exchange rate was estimated with a smaller makerAmount than actual ${convertedMakerAmount}`
      )
      // Note that exchange will still go through if makerAmount difference is within EXCHANGE_DIFFERENCE_TOLERATED
    }

    // Ensure the user gets makerAmount at least as good as displayed (rounded to EXCHANGE_DIFFERENCE_TOLERATED)
    const minimumTakerAmount = BigNumber.maximum(
      getTakerAmount(makerAmount, exchangeRate).multipliedBy(
        1 - EXCHANGE_DIFFERENCE_PERCENT_TOLERATED
      ),
      0
    )
    const updatedTakerAmount = getTakerAmount(makerAmount, updatedExchangeRate)
    if (minimumTakerAmount.isGreaterThan(updatedTakerAmount)) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: `Not receiving enough ${makerToken}. Expected ${minimumTakerAmount} but received ${updatedTakerAmount.toString()}`,
      })
      Logger.error(
        TAG,
        `Not receiving enough ${makerToken} due to change in exchange rate. Exchange failed.`
      )
      yield put(showError(ErrorMessages.EXCHANGE_RATE_CHANGE))
      return
    }

    const convertedTakerAmount: BigNumber = roundDown(
      yield call(convertToContractDecimals, minimumTakerAmount, takerToken),
      0
    )
    Logger.debug(
      TAG,
      `Will receive at least ${convertedTakerAmount}
      wei for ${convertedMakerAmount} wei of ${makerToken}`
    )

    // Generate and send a transaction to approve payment to the exchange.
    let approveTx
    if (makerToken === Currency.Celo) {
      approveTx = goldTokenContract.approve(
        exchangeContract.address,
        convertedMakerAmount.toString()
      )
    } else {
      approveTx = stableTokenContract.approve(
        exchangeContract.address,
        convertedMakerAmount.toString()
      )
    }

    const feeCurrency: string | undefined = yield call(currencyToFeeCurrency, makerToken)
    yield call(
      sendTransaction,
      approveTx.txo,
      account,
      newTransactionContext(TAG, `Approve exchange of ${makerToken}`),
      undefined, // gas
      undefined, // gasPrice
      feeCurrency
    )
    Logger.debug(TAG, `Transaction approved: ${util.inspect(approveTx.txo.arguments)}`)

    contractKit.defaultAccount = account

    const tx: CeloTransactionObject<string> = yield call(
      exchangeContract.exchange,
      convertedMakerAmount.toString(),
      convertedTakerAmount.toString(),
      sellGold
    )

    if (context === null) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, {
        error: 'Missing transaction ID',
      })
      Logger.error(TAG, 'No transaction ID. Did not exchange.')
      return
    }
    const nonce: number = yield call(getLatestNonce, account)
    const { receipt, error } = yield call(
      sendAndMonitorTransaction,
      tx,
      account,
      context,
      feeCurrency,
      undefined, // gas
      undefined, // gasPrice
      nonce + 1
    )
    if (receipt) {
      ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_complete, {
        txId: context.id,
        currency: makerToken,
        amount: makerAmount.toString(),
      })
    } else {
      throw error
    }
  } catch (error) {
    ValoraAnalytics.track(CeloExchangeEvents.celo_exchange_error, { error: error?.message })
    Logger.error(TAG, 'Error doing exchange', error)
    const isCeloPurchase = takerToken === Currency.Celo

    ValoraAnalytics.track(
      isCeloPurchase ? CeloExchangeEvents.celo_buy_error : CeloExchangeEvents.celo_sell_error,
      {
        error,
      }
    )
    if (context?.id) {
      yield put(removeStandbyTransaction(context.id))
    }

    yield put(showErrorOrFallback(error, ErrorMessages.EXCHANGE_FAILED))
  }
}

function* createStandbyTx(
  makerToken: Currency,
  makerAmount: BigNumber,
  takerToken: Currency,
  exchangeRate: BigNumber
) {
  const takerAmount = getTakerAmount(makerAmount, exchangeRate)
  const context = newTransactionContext(TAG, `Exchange ${makerToken}`)
  yield put(
    addStandbyTransactionLegacy({
      context,
      type: TokenTransactionType.Exchange,
      status: TransactionStatus.Pending,
      inCurrency: makerToken,
      inValue: makerAmount.toString(),
      outCurrency: takerToken,
      outValue: takerAmount.toString(),
      timestamp: Math.floor(Date.now() / 1000),
    })
  )

  const makerTokenAddress: string = yield call(getCurrencyAddress, makerToken)
  const takerTokenAddress: string = yield call(getCurrencyAddress, takerToken)

  yield put(
    addStandbyTransaction({
      context: context,
      type: TokenTransactionTypeV2.Exchange,
      status: TransactionStatus.Pending,
      inValue: makerAmount.toString(),
      inTokenAddress: makerTokenAddress,
      outValue: takerAmount.toString(),
      outTokenAddress: takerTokenAddress,
      timestamp: Math.floor(Date.now() / 1000),
    })
  )

  return context
}

function* celoToDollarAmount(amount: BigNumber) {
  const exchangeRates: ExchangeRates = yield select(exchangeRatesSelector)
  const exchangeRate = getRateForMakerToken(exchangeRates, Currency.Dollar, Currency.Celo)
  return goldToDollarAmount(amount, exchangeRate) || new BigNumber(0)
}

export function* withdrawCelo(action: WithdrawCeloAction) {
  let context: TransactionContext | null = null
  try {
    const { recipientAddress, amount, isCashOut } = action
    const account: string = yield call(getConnectedUnlockedAccount)

    navigate(isCashOut ? Screens.WalletHome : Screens.ExchangeHomeScreen)

    context = newTransactionContext(TAG, 'Withdraw CELO')
    yield put(
      addStandbyTransactionLegacy({
        context,
        type: TokenTransactionType.Sent,
        comment: '',
        status: TransactionStatus.Pending,
        value: amount.toString(),
        currency: Currency.Celo,
        timestamp: Math.floor(Date.now() / 1000),
        address: recipientAddress,
      })
    )

    const celoTokenAddress: string = yield select(celoAddressSelector)
    yield put(
      addStandbyTransaction({
        context,
        type: TokenTransactionTypeV2.Sent,
        comment: '',
        status: TransactionStatus.Pending,
        value: amount.toString(),
        tokenAddress: celoTokenAddress,
        timestamp: Math.floor(Date.now() / 1000),
        address: recipientAddress,
      })
    )

    const tx: CeloTransactionObject<boolean> = yield call(
      createTokenTransferTransaction,
      celoTokenAddress,
      {
        recipientAddress,
        amount,
        comment: '',
      }
    )

    yield call(sendAndMonitorTransaction, tx, account, context)

    const dollarAmount = yield call(celoToDollarAmount, amount)
    yield put(sendPaymentOrInviteSuccess(dollarAmount))

    yield put(withdrawCeloSuccess())

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_completed, {
      amount: amount.toString(),
    })
  } catch (error) {
    if (error.message === ErrorMessages.PIN_INPUT_CANCELED) {
      yield put(withdrawCeloCanceled())
      return
    }

    Logger.error(TAG, 'Error withdrawing CELO', error)
    const errorToShow =
      error.message === ErrorMessages.INCORRECT_PIN
        ? ErrorMessages.INCORRECT_PIN
        : ErrorMessages.TRANSACTION_FAILED
    yield put(withdrawCeloFailed(context?.id, errorToShow))

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_error, {
      error,
    })
  }
}

export function* watchFetchTobinTax() {
  yield takeLatest(Actions.FETCH_TOBIN_TAX, doFetchTobinTax)
}

export function* watchFetchExchangeRate() {
  yield takeLatest(Actions.FETCH_EXCHANGE_RATE, doFetchExchangeRate)
}

export function* watchExchangeTokens() {
  yield takeEvery(Actions.EXCHANGE_TOKENS, exchangeGoldAndStableTokens)
}

export function* watchWithdrawCelo() {
  yield takeEvery(Actions.WITHDRAW_CELO, withdrawCelo)
}

export function* exchangeSaga() {
  yield spawn(watchFetchExchangeRate)
  yield spawn(watchFetchTobinTax)
  yield spawn(watchExchangeTokens)
  yield spawn(watchWithdrawCelo)
}

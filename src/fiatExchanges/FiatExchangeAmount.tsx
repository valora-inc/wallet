import { parseInputAmount } from '@celo/utils/lib/parsing'
import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import { ALERT_BANNER_DURATION, DOLLAR_ADD_FUNDS_MAX_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import { useMaxSendAmount } from 'src/fees/hooks'
import { FeeType } from 'src/fees/reducer'
import { convertToFiatConnectFiatCurrency } from 'src/fiatconnect'
import {
  attemptReturnUserFlowLoadingSelector,
  cachedFiatAccountUsesSelector,
} from 'src/fiatconnect/selectors'
import { attemptReturnUserFlow } from 'src/fiatconnect/slice'
import i18n from 'src/i18n'
import { LocalCurrencyCode, LocalCurrencySymbol } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithTokenBalance } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import {
  useConvertBetweenTokens,
  useLocalToTokenAmount,
  useTokenInfoBySymbol,
  useTokenToLocalAmount,
} from 'src/tokens/hooks'
import { CiCoCurrency, Currency, currencyForAnalytics } from 'src/utils/currencies'
import { roundUp } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { CICOFlow, isUserInputCrypto } from './utils'

const TAG = 'FiatExchangeAmount'

const { decimalSeparator } = getNumberFormatSettings()

const cicoCurrencyTranslationKeys = {
  [CiCoCurrency.CELO]: 'subtotal',
  [CiCoCurrency.cEUR]: 'celoEuro',
  [CiCoCurrency.cUSD]: 'celoDollar',
  [CiCoCurrency.cREAL]: 'celoReal',
}

type RouteProps = NativeStackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

function FiatExchangeAmount({ route }: Props) {
  const { t } = useTranslation()
  const { currency, flow } = route.params

  const [showingInvalidAmountDialog, setShowingInvalidAmountDialog] = useState(false)
  const closeInvalidAmountDialog = () => {
    setShowingInvalidAmountDialog(false)
  }
  const [inputAmount, setInputAmount] = useState('')
  const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)
  const { address } = useTokenInfoBySymbol(currency)!

  const inputConvertedToCrypto =
    useLocalToTokenAmount(parsedInputAmount, address) || new BigNumber(0)
  const inputConvertedToLocalCurrency =
    useTokenToLocalAmount(parsedInputAmount, address) || new BigNumber(0)
  const localCurrencyCode = useLocalCurrencyCode()
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)
  const cachedFiatAccountUses = useSelector(cachedFiatAccountUsesSelector)
  const attemptReturnUserFlowLoading = useSelector(attemptReturnUserFlowLoadingSelector)

  const localCurrencySymbol = LocalCurrencySymbol[localCurrencyCode]

  const inputIsCrypto = isUserInputCrypto(flow, currency)

  const inputCryptoAmount = inputIsCrypto ? parsedInputAmount : inputConvertedToCrypto
  const inputLocalCurrencyAmount = inputIsCrypto ? inputConvertedToLocalCurrency : parsedInputAmount

  const maxWithdrawAmount = useMaxSendAmount(address, FeeType.SEND)

  const inputSymbol = inputIsCrypto ? '' : localCurrencySymbol

  const displayCurrencyKey = cicoCurrencyTranslationKeys[currency]

  const cUSDToken = useTokenInfoBySymbol(CiCoCurrency.cUSD)!
  const localCurrencyMaxAmount =
    useTokenToLocalAmount(new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT), cUSDToken.address) ||
    new BigNumber(0)

  const currencyMaxAmount =
    useConvertBetweenTokens(
      new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT),
      cUSDToken.address,
      address
    ) || new BigNumber(0)

  let overLocalLimitDisplayString = ''
  if (localCurrencyCode !== LocalCurrencyCode.USD) {
    overLocalLimitDisplayString =
      currency === CiCoCurrency.CELO
        ? ` (${roundUp(currencyMaxAmount, 3)} CELO)`
        : ` (${localCurrencySymbol}${roundUp(localCurrencyMaxAmount)})`
  }

  const dispatch = useDispatch()

  React.useEffect(() => {
    dispatch(fetchExchangeRate())
  }, [])

  if (!address) {
    Logger.error(TAG, "Couldn't grab the exchange token info")
    return null
  }

  function isNextButtonValid() {
    return parsedInputAmount.isGreaterThan(0)
  }

  function onChangeExchangeAmount(amount: string) {
    setInputAmount(amount.replace(localCurrencySymbol, ''))
  }

  function goToProvidersScreen() {
    ValoraAnalytics.track(FiatExchangeEvents.cico_amount_chosen, {
      amount: inputCryptoAmount.toNumber(),
      currency: currencyForAnalytics[currency],
      flow,
    })
    const amount = {
      crypto: inputCryptoAmount.toNumber(),
      // Rounding up to avoid decimal errors from providers. Won't be
      // necessary once we support inputting an amount in both crypto and fiat
      fiat: Math.round(inputLocalCurrencyAmount.toNumber()),
    }

    const previousFiatAccount = cachedFiatAccountUses.find(
      (account) =>
        account.cryptoType === currency &&
        account.fiatType === convertToFiatConnectFiatCurrency(localCurrencyCode)
    )
    if (previousFiatAccount) {
      // This will attempt to navigate to the Review Screen if the proper quote and fiatAccount are found
      // If not, then the user will be navigated to the SelectProvider screen as normal
      const { providerId, fiatAccountId, fiatAccountType, fiatAccountSchema } = previousFiatAccount
      dispatch(
        attemptReturnUserFlow({
          flow,
          selectedCrypto: currency,
          amount,
          providerId,
          fiatAccountId,
          fiatAccountType,
          fiatAccountSchema,
        })
      )
    } else {
      navigate(Screens.SelectProvider, {
        flow,
        selectedCrypto: currency,
        amount,
      })
    }
  }

  function onPressContinue() {
    if (flow === CICOFlow.CashIn) {
      if (inputLocalCurrencyAmount.isGreaterThan(localCurrencyMaxAmount)) {
        setShowingInvalidAmountDialog(true)
        ValoraAnalytics.track(FiatExchangeEvents.cico_amount_chosen_invalid, {
          amount: inputCryptoAmount.toNumber(),
          currency: currencyForAnalytics[currency],
          flow,
        })
        return
      }
    } else if (maxWithdrawAmount.isLessThan(inputCryptoAmount)) {
      dispatch(
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, ALERT_BANNER_DURATION, {
          balance: maxWithdrawAmount.toFixed(2),
          currency: currency,
        })
      )
      return
    }

    goToProvidersScreen()
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Dialog
        isVisible={showingInvalidAmountDialog}
        actionText={t('invalidAmountDialog.dismiss')}
        actionPress={closeInvalidAmountDialog}
        isActionHighlighted={false}
        onBackgroundPress={closeInvalidAmountDialog}
        testID={'invalidAmountDialog'}
      >
        {t('invalidAmountDialog.maxAmount', {
          usdLimit: `$${DOLLAR_ADD_FUNDS_MAX_AMOUNT}`,
          localLimit: overLocalLimitDisplayString,
        })}
      </Dialog>
      <DisconnectBanner />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.amountInputContainer}>
          <View>
            <Text style={styles.exchangeBodyText}>
              {inputIsCrypto ? `${t('amount')} (${currency})` : t('amount')}
            </Text>
          </View>
          <TextInput
            multiline={true}
            autoFocus={true}
            keyboardType={'decimal-pad'}
            onChangeText={onChangeExchangeAmount}
            value={inputAmount.length > 0 ? `${inputSymbol}${inputAmount}` : undefined}
            placeholderTextColor={colors.gray3}
            placeholder={`${inputSymbol}0`}
            style={[styles.currencyInput, styles.fiatCurrencyColor]}
            testID="FiatExchangeInput"
          />
        </View>
        <LineItemRow
          testID="subtotal"
          textStyle={styles.subtotalBodyText}
          title={
            <>
              {`${t(displayCurrencyKey)} @ `}
              {
                <TokenDisplay
                  amount={BigNumber(1)}
                  tokenAddress={address}
                  showLocalAmount={true}
                  hideSign={false}
                />
              }
            </>
          }
          amount={
            <TokenDisplay
              amount={inputCryptoAmount}
              tokenAddress={address}
              showLocalAmount={inputIsCrypto}
              hideSign={false}
            />
          }
        />
      </KeyboardAwareScrollView>
      {currency !== CiCoCurrency.CELO && (
        <Text style={styles.disclaimerFiat}>
          {t('disclaimerFiat', { currency: t(displayCurrencyKey) })}
        </Text>
      )}
      <Button
        onPress={onPressContinue}
        showLoading={exchangeRates[Currency.Dollar] === null || attemptReturnUserFlowLoading}
        text={t('next')}
        type={BtnTypes.PRIMARY}
        accessibilityLabel={t('next') ?? undefined}
        disabled={!isNextButtonValid()}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="FiatExchangeNextButton"
      />
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

FiatExchangeAmount.navOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatExchangeAmount>
}) => {
  const { currency, flow } = route.params
  const inputIsCrypto = isUserInputCrypto(flow, currency)
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={FiatExchangeEvents.cico_amount_back} />,
    headerTitle: () => (
      <FiatExchangeAmountHeader
        title={i18n.t(
          route.params.flow === CICOFlow.CashIn
            ? `fiatExchangeFlow.cashIn.exchangeAmountTitle`
            : `fiatExchangeFlow.cashOut.exchangeAmountTitle`,
          {
            currency,
          }
        )}
        currency={currency}
        showLocalAmount={!inputIsCrypto}
      />
    ),
  }
}

function FiatExchangeAmountHeader({
  title,
  currency,
  showLocalAmount,
}: {
  title: string | React.ReactNode
  currency: CiCoCurrency
  showLocalAmount: boolean
}) {
  const tokenInfo = useTokenInfoBySymbol(currency)
  return (
    <HeaderTitleWithTokenBalance
      tokenInfo={tokenInfo}
      title={title}
      showLocalAmount={showLocalAmount}
    />
  )
}

export default FiatExchangeAmount

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    marginTop: 24,
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  exchangeBodyText: {
    ...fontStyles.regular500,
  },
  subtotalBodyText: {
    ...fontStyles.small,
  },
  currencyInput: {
    ...fontStyles.regular,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 19,
    lineHeight: Platform.select({ android: 27, ios: 23 }), // vertical align = center
    minHeight: 48, // setting height manually b.c. of bug causing text to jump on Android
  },
  fiatCurrencyColor: {
    color: colors.greenUI,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
  disclaimerFiat: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
  },
})

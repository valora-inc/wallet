import { parseInputAmount } from '@celo/utils/lib/parsing'
import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Dialog from 'src/components/Dialog'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { ALERT_BANNER_DURATION, DOLLAR_ADD_FUNDS_MAX_AMOUNT } from 'src/config'
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
import { usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { HeaderTitleWithTokenBalance, emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useLocalToTokenAmount, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { tokenSymbolToAnalyticsCurrency } from 'src/utils/currencies'
import { roundUp } from 'src/utils/formatting'
import networkConfig from 'src/web3/networkConfig'
import { CICOFlow, isUserInputCrypto } from './utils'

const { decimalSeparator } = getNumberFormatSettings()

type RouteProps = NativeStackScreenProps<StackParamList, Screens.FiatExchangeAmount>

type Props = RouteProps

function FiatExchangeAmount({ route }: Props) {
  const { t } = useTranslation()
  const { flow, tokenId, tokenSymbol } = route.params

  const [showingInvalidAmountDialog, setShowingInvalidAmountDialog] = useState(false)
  const closeInvalidAmountDialog = () => {
    setShowingInvalidAmountDialog(false)
  }
  const [inputAmount, setInputAmount] = useState('')
  const parsedInputAmount = parseInputAmount(inputAmount, decimalSeparator)

  const inputConvertedToCrypto =
    useLocalToTokenAmount(parsedInputAmount, tokenId) || new BigNumber(0)
  const inputConvertedToLocalCurrency =
    useTokenToLocalAmount(parsedInputAmount, tokenId) || new BigNumber(0)
  const localCurrencyCode = useLocalCurrencyCode()
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const cachedFiatAccountUses = useSelector(cachedFiatAccountUsesSelector)
  const attemptReturnUserFlowLoading = useSelector(attemptReturnUserFlowLoadingSelector)

  const localCurrencySymbol = LocalCurrencySymbol[localCurrencyCode]

  const inputIsCrypto = isUserInputCrypto(flow)

  const inputCryptoAmount = inputIsCrypto ? parsedInputAmount : inputConvertedToCrypto
  const inputLocalCurrencyAmount = inputIsCrypto ? inputConvertedToLocalCurrency : parsedInputAmount

  const maxWithdrawAmount = useMaxSendAmount(tokenId, FeeType.SEND)

  const inputSymbol = inputIsCrypto ? '' : localCurrencySymbol

  const cUSDToken = useTokenInfo(networkConfig.cusdTokenId)!
  const localCurrencyMaxAmount =
    useTokenToLocalAmount(new BigNumber(DOLLAR_ADD_FUNDS_MAX_AMOUNT), cUSDToken.tokenId) ||
    new BigNumber(0)
  let overLocalLimitDisplayString = ''
  if (localCurrencyCode !== LocalCurrencyCode.USD) {
    overLocalLimitDisplayString = ` (${localCurrencySymbol}${roundUp(localCurrencyMaxAmount)})`
  }

  const dispatch = useDispatch()

  function isNextButtonValid() {
    return parsedInputAmount.isGreaterThan(0)
  }

  function onChangeExchangeAmount(amount: string) {
    setInputAmount(amount.replace(localCurrencySymbol, ''))
  }

  function goToProvidersScreen() {
    ValoraAnalytics.track(FiatExchangeEvents.cico_amount_chosen, {
      amount: inputCryptoAmount.toNumber(),
      currency: tokenSymbolToAnalyticsCurrency(tokenSymbol),
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
        account.cryptoType === tokenSymbol &&
        account.fiatType === convertToFiatConnectFiatCurrency(localCurrencyCode)
    )
    if (previousFiatAccount) {
      // This will attempt to navigate to the Review Screen if the proper quote and fiatAccount are found
      // If not, then the user will be navigated to the SelectProvider screen as normal
      const { providerId, fiatAccountId, fiatAccountType, fiatAccountSchema } = previousFiatAccount
      dispatch(
        attemptReturnUserFlow({
          flow,
          selectedCrypto: tokenSymbol,
          amount,
          providerId,
          fiatAccountId,
          fiatAccountType,
          fiatAccountSchema,
          tokenId,
        })
      )
    } else {
      navigate(Screens.SelectProvider, {
        flow,
        tokenId,
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
          currency: tokenSymbolToAnalyticsCurrency(tokenSymbol),
          flow,
        })
        return
      }
    } else if (maxWithdrawAmount.isLessThan(inputCryptoAmount)) {
      dispatch(
        showError(ErrorMessages.CASH_OUT_LIMIT_EXCEEDED, ALERT_BANNER_DURATION, {
          balance: maxWithdrawAmount.toFixed(2),
          currency: tokenSymbol,
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
              {inputIsCrypto ? `${t('amount')} (${tokenSymbol})` : t('amount')}
            </Text>
          </View>
          <TextInput
            multiline={false}
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
      </KeyboardAwareScrollView>
      <Button
        onPress={onPressContinue}
        showLoading={usdToLocalRate === null || attemptReturnUserFlowLoading}
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
  const { flow, tokenId, tokenSymbol } = route.params
  const inputIsCrypto = isUserInputCrypto(flow)
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
            currency: tokenSymbol,
          }
        )}
        tokenId={tokenId}
        showLocalAmount={!inputIsCrypto}
      />
    ),
  }
}

function FiatExchangeAmountHeader({
  title,
  tokenId,
  showLocalAmount,
}: {
  title: string | React.ReactNode
  tokenId: string
  showLocalAmount: boolean
}) {
  const tokenInfo = useTokenInfo(tokenId)
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
    color: colors.primary,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})

import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import NumberKeypad from '@celo/react-components/components/NumberKeypad'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import variables from '@celo/react-components/styles/variables'
import { CURRENCY_ENUM } from '@celo/utils/lib/currencies'
import { parseInputAmount } from '@celo/utils/lib/parsing'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { TokenTransactionType } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import {
  ALERT_BANNER_DURATION,
  DEFAULT_DAILY_PAYMENT_LIMIT_CUSD,
  DOLLAR_TRANSACTION_MIN_AMOUNT,
  NUMBER_INPUT_MAX_DECIMALS,
} from 'src/config'
import { getFeeEstimateDollars } from 'src/fees/selectors'
import i18n, { Namespaces } from 'src/i18n'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import {
  AddressValidationType,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/reducer'
import { getAddressValidationType } from 'src/identity/secureSend'
import { RecipientVerificationStatus } from 'src/identity/types'
import {
  convertDollarsToLocalAmount,
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import {
  getLocalCurrencyCode,
  getLocalCurrencyExchangeRate,
  getLocalCurrencySymbol,
} from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getRecipientVerificationStatus, Recipient, RecipientKind } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { getFeeType, useDailyTransferLimitValidator } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { fetchDollarBalance } from 'src/stableToken/actions'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { DOLLAR_ADD_FUNDS_MIN_AMOUNT } from 'src/config'

const MAX_ESCROW_VALUE = new BigNumber(20)

type RouteProps = StackScreenProps<StackParamList, Screens.FiatExchangeIntegratedAmount>
type Props = RouteProps

const { decimalSeparator } = getNumberFormatSettings()

export const fiatExchangeIntegratedAmountOptions = () => {
  console.log('--------------------- options read')
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={FiatExchangeEvents.cico_add_funds_amount_continue} />,
    headerTitle: () => <HeaderTitleWithBalance title={'title'} token={CURRENCY_ENUM.DOLLAR} />,
  }
}

function FiatExchangeIntegratedAmount(props: Props) {
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const [amount, setAmount] = useState('')
  const [reviewButtonPressed, setReviewButtonPressed] = useState(false)

  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const minAmountInLocalCurrency = convertDollarsToLocalAmount(
    DOLLAR_ADD_FUNDS_MIN_AMOUNT,
    localCurrencyExchangeRate
  )?.toFixed(0)

  const dispatch = useDispatch()

  const maxLength = React.useMemo(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos === -1) {
      return null
    }
    return decimalPos + NUMBER_INPUT_MAX_DECIMALS + 1
  }, [amount, decimalSeparator])

  const onDigitPress = React.useCallback(
    (digit) => {
      if ((amount === '' && digit === 0) || (maxLength && amount.length + 1 > maxLength)) {
        return
      }
      setAmount(amount + digit.toString())
    },
    [amount, setAmount]
  )

  const onBackspacePress = React.useCallback(() => {
    setAmount(amount.substr(0, amount.length - 1))
  }, [amount, setAmount])

  const onDecimalPress = React.useCallback(() => {
    const decimalPos = amount.indexOf(decimalSeparator ?? '.')
    if (decimalPos !== -1) {
      return
    }

    if (!amount) {
      setAmount('0' + decimalSeparator)
    } else {
      setAmount(amount + decimalSeparator)
    }
  }, [amount, setAmount])

  const getDollarAmount = (localAmount: BigNumber.Value) => {
    const dollarsAmount =
      convertLocalAmountToDollars(localAmount, localCurrencyExchangeRate) || new BigNumber('')

    return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  }

  const parsedLocalAmount = parseInputAmount(amount, decimalSeparator)
  const dollarAmount = getDollarAmount(parsedLocalAmount)

  const isAmountValid = dollarAmount.isGreaterThanOrEqualTo(DOLLAR_ADD_FUNDS_MIN_AMOUNT)
  const showMinError = !isAmountValid && parsedLocalAmount.isGreaterThan(0)

  return (
    <SafeAreaView style={styles.paddedContainer}>
      <DisconnectBanner />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.showAmountContainer}>
          <View style={styles.amountLine}>
            <View style={styles.currencySymbolContainer}>
              <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.currencySymbol}>
                {localCurrencySymbol || localCurrencyCode}
              </Text>
            </View>
            <View style={styles.amountContainer}>
              <Text adjustsFontSizeToFit={true} numberOfLines={1} style={styles.amount}>
                {amount ? amount : '0'}
              </Text>
            </View>
          </View>
          {showMinError && (
            <Text style={styles.amountError}>
              The minimum order is {localCurrencySymbol}
              {minAmountInLocalCurrency}
            </Text>
          )}
        </View>
        <NumberKeypad
          onDigitPress={onDigitPress}
          onBackspacePress={onBackspacePress}
          decimalSeparator={decimalSeparator}
          onDecimalPress={onDecimalPress}
        />
      </ScrollView>
      <Button
        style={styles.nextBtn}
        size={BtnSizes.FULL}
        text={t('global:review')}
        type={BtnTypes.SECONDARY}
        onPress={/*onReviewButtonPressed*/ () => null}
        disabled={!isAmountValid || reviewButtonPressed}
        testID="Review"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  paddedContainer: {
    flex: 1,
    paddingHorizontal: variables.contentPadding,
  },
  contentContainer: {
    flex: 1,
  },
  showAmountContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  amountContainer: {
    justifyContent: 'center',
    maxWidth: '75%',
  },
  amountLine: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  amountError: {
    ...fontStyles.small,
    color: colors.gray4,
    textAlign: 'center',
  },
  currencySymbolContainer: {
    justifyContent: 'center',
  },
  currencySymbol: {
    ...fontStyles.regular,
    fontSize: 32,
    lineHeight: 64,
    marginRight: 8,
  },
  currencySymbolTransparent: {
    color: 'transparent',
  },
  amount: {
    ...fontStyles.regular,
    fontSize: 64,
    lineHeight: undefined,
  },
  nextBtn: {
    paddingVertical: variables.contentPadding,
  },
})

export default FiatExchangeIntegratedAmount

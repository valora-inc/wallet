// SCREEN First step on the "Withdraw CELO" flow where user provides an address to withdraw to
// and an amount.

import { parseInputAmount } from '@celo/utils/lib/parsing'
import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { isAddressFormat } from 'src/account/utils'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import AccountAddressInput from 'src/components/AccountAddressInput'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CeloAmountInput from 'src/components/CeloAmountInput'
import KeyboardAwareScrollView from 'src/components/KeyboardAwareScrollView'
import KeyboardSpacer from 'src/components/KeyboardSpacer'
import { exchangeRatesSelector } from 'src/exchange/reducer'
import { useSendFee } from 'src/fees/CalculateFee'
import { FeeType } from 'src/fees/reducer'
import i18n from 'src/i18n'
import { HeaderTitleWithBalance, headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import useSelector from 'src/redux/useSelector'
import { useDailyTransferLimitValidator } from 'src/send/utils'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { useBalance } from 'src/stableToken/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'
import { divideByWei } from 'src/utils/formatting'

type Props = StackScreenProps<StackParamList, Screens.WithdrawCeloScreen>

const { decimalSeparator } = getNumberFormatSettings()
const RANDOM_ADDRESS = '0xDCE9762d6C1fe89FF4f3857832131Ca18eE15C66'

function WithdrawCeloScreen({ route }: Props) {
  const [accountAddress, setAccountAddress] = useState(route.params?.recipientAddress ?? '')
  const [celoInput, setCeloToTransfer] = useState(route.params?.amount?.toString() ?? '')
  const celoToTransfer = parseInputAmount(celoInput, decimalSeparator)

  const celoBalance = useBalance(Currency.Celo) ?? new BigNumber(0)
  const { t } = useTranslation()

  const readyToReview =
    isAddressFormat(accountAddress) &&
    celoToTransfer.isGreaterThan(0) &&
    celoToTransfer.isLessThanOrEqualTo(celoBalance)

  const exchangeRates = useSelector(exchangeRatesSelector)

  const [isTransferLimitReached, showLimitReachedBanner] = useDailyTransferLimitValidator(
    celoToTransfer,
    Currency.Celo
  )

  const { result } = useSendFee({
    feeType: FeeType.SEND,
    account: RANDOM_ADDRESS,
    currency: Currency.Celo,
    recipientAddress: RANDOM_ADDRESS,
    amount: celoBalance.toString(),
    balance: celoBalance.toString(),
    includeDekFee: false,
  })
  const feeEstimate = result && divideByWei(result.fee)

  const onConfirm = async () => {
    if (isTransferLimitReached) {
      showLimitReachedBanner()
      return
    }

    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_review, {
      amount: celoToTransfer.toString(),
    })
    navigate(Screens.WithdrawCeloReviewScreen, {
      amount: celoToTransfer,
      recipientAddress: accountAddress,
      feeEstimate: feeEstimate || new BigNumber(0),
      isCashOut: route.params?.isCashOut,
    })
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisconnectBanner />
      <KeyboardAwareScrollView
        keyboardShouldPersistTaps={'always'}
        contentContainerStyle={styles.contentContainer}
      >
        <Text style={styles.inputLabel}>{t('accountAddressLabel')}</Text>
        <AccountAddressInput
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          onAddressChanged={setAccountAddress}
          accountAddress={accountAddress}
        />
        <Text style={styles.inputLabel}>{t('celoAmountLabel')}</Text>
        <CeloAmountInput
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.input}
          onCeloChanged={setCeloToTransfer}
          celo={celoInput}
          feeEstimate={feeEstimate}
        />
      </KeyboardAwareScrollView>
      <Button
        onPress={onConfirm}
        text={t(`review`)}
        accessibilityLabel={t('continue')}
        disabled={!readyToReview}
        type={BtnTypes.SECONDARY}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        showLoading={exchangeRates === null}
        testID="WithdrawReviewButton"
      />
      <KeyboardSpacer />
    </SafeAreaView>
  )
}

WithdrawCeloScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.WithdrawCeloScreen>
}) => {
  return {
    ...headerWithBackButton,
    headerTitle: () => (
      <HeaderTitleWithBalance
        title={i18n.t(route.params?.isCashOut ? 'cashOut' : 'withdrawCelo')}
        token={Currency.Celo}
      />
    ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  inputLabel: {
    marginTop: 24,
    marginBottom: 4,
    ...fontStyles.label,
  },
  inputContainer: {
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: colors.gray3,
  },
  input: {
    ...fontStyles.regular,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})

export default WithdrawCeloScreen

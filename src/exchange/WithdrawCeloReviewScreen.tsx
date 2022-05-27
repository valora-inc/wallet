// SCREEN where users can review the data about the witdrawal of CELO they are about to make
// and confirm.

import { NavigationProp, RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { PixelRatio, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import ShortenedAddress from 'src/components/ShortenedAddress'
import { withdrawCelo } from 'src/exchange/actions'
import WithdrawCeloSummary from 'src/exchange/WithdrawCeloSummary'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import Times from 'src/icons/Times'
import BackButton from 'src/navigator/BackButton'
import { HeaderTitleWithBalance, headerWithBackEditButtons } from 'src/navigator/Headers'
import {
  navigate,
  navigateBack,
  navigateToExchangeHome,
  replace,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import useTypedSelector from 'src/redux/useSelector'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { Currency } from 'src/utils/currencies'

type Props = StackScreenProps<StackParamList, Screens.WithdrawCeloReviewScreen>

function WithdrawCeloReviewScreen({ route }: Props) {
  const { amount, recipientAddress, feeEstimate, isCashOut } = route.params
  const { t } = useTranslation()
  const isLoading = useTypedSelector((state) => state.exchange.isLoading)
  const dispatch = useDispatch()

  const onConfirmWithdraw = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_confirm, {
      amount: amount.toString(),
    })
    dispatch(withdrawCelo(amount, recipientAddress, isCashOut))
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <DisconnectBanner />
      <View style={styles.contentContainer}>
        <LineItemRow
          title={t('withdrawCeloTo')}
          textStyle={fontStyles.regular}
          amount={<ShortenedAddress style={styles.withdrawAddress} address={recipientAddress} />}
        />
        <HorizontalLine />
        <WithdrawCeloSummary
          amount={amount}
          recipientAddress={recipientAddress}
          feeEstimate={feeEstimate}
        />
      </View>
      <Button
        disabled={isLoading}
        onPress={onConfirmWithdraw}
        text={t(`withdraw`)}
        type={BtnTypes.TERTIARY}
        size={BtnSizes.FULL}
        style={styles.reviewBtn}
        testID="ConfirmWithdrawButton"
        showLoading={isLoading}
        loadingColor={colors.light}
      />
    </SafeAreaView>
  )
}

WithdrawCeloReviewScreen.navigationOptions = ({
  navigation,
  route,
}: {
  navigation: NavigationProp<StackParamList, Screens.WithdrawCeloReviewScreen>
  route: RouteProp<StackParamList, Screens.WithdrawCeloReviewScreen>
}) => {
  const isCashOut = !!route.params?.isCashOut
  const onCancel = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_cancel)
    if (isCashOut) {
      navigate(Screens.FiatExchangeCurrency, { flow: FiatExchangeFlow.CashOut })
    } else {
      navigateToExchangeHome()
    }
  }
  const onEdit = () => {
    ValoraAnalytics.track(CeloExchangeEvents.celo_withdraw_edit)
    const canGoBack = navigation
      .getState()
      .routes.some((screen) => screen.name === Screens.WithdrawCeloScreen)
    if (canGoBack) {
      navigateBack()
    } else {
      replace(Screens.WithdrawCeloScreen, {
        isCashOut,
        amount: route.params?.amount,
        recipientAddress: route.params?.recipientAddress,
      })
    }
  }
  return {
    ...headerWithBackEditButtons,
    headerTitle: () => (
      <HeaderTitleWithBalance title={i18n.t('withdrawCeloReview')} token={Currency.Celo} />
    ),
    headerLeft: () => (
      <TopBarIconButton
        icon={<BackButton />}
        testID="EditButton"
        onPress={onEdit}
        eventName={CeloExchangeEvents.celo_sell_edit}
      />
    ),
    headerRight: () =>
      PixelRatio.getFontScale() > 1 ? (
        <TopBarIconButton icon={<Times />} testID="CancelButton" onPress={onCancel} />
      ) : (
        <CancelButton buttonType={'text'} onCancel={onCancel} />
      ),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    marginTop: 38,
    paddingHorizontal: 16,
  },
  withdrawAddress: {
    ...fontStyles.regular,
    fontSize: 19,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})

export default WithdrawCeloReviewScreen

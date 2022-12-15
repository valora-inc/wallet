import { RouteProp } from '@react-navigation/native'
import { StackParamList } from 'src/navigator/types'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useRef, useState, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View, Text } from 'react-native'
import { useDispatch } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import StyledQRCode from 'src/qrcode/StyledQRCode'
import { useSelector } from 'react-redux'
import { SVG, shareQRCode } from 'src/send/actions'
import Logger from 'src/utils/Logger'
import { FiatExchangeEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import { emptyHeader } from 'src/navigator/Headers'
import { CICOFlow } from './utils'
import i18n from 'src/i18n'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import Share from 'src/icons/Share'
import { walletAddressSelector } from 'src/web3/selectors'
import { nameSelector } from 'src/account/selectors'
import variables from 'src/styles/variables'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import Button from 'src/components/Button'
import Paste from 'src/icons/Paste'
import Clipboard from '@react-native-clipboard/clipboard'
import ExchangesBottomSheet from 'src/components/ExchangesBottomSheet'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'

type Props = NativeStackScreenProps<StackParamList, Screens.ExchangeQR>

export default function ExchangeQR({ route, navigation }: Props) {
  const qrSvgRef = useRef<SVG>()
  const { flow, exchanges } = route.params
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const address = useSelector(walletAddressSelector)
  const displayName = useSelector(nameSelector)

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false)

  const onCloseBottomSheet = () => {
    ValoraAnalytics.track(FiatExchangeEvents.external_exchange_qr_bottom_sheet_close, {
      flow,
    })
    setBottomSheetVisible(false)
  }

  const onPressShare = () => {
    ValoraAnalytics.track(FiatExchangeEvents.external_exchange_qr_share, {
      flow,
    })
    dispatch(shareQRCode(qrSvgRef.current))
  }

  const onPressCopy = () => {
    ValoraAnalytics.track(FiatExchangeEvents.external_exchange_qr_copy_address, {
      flow,
    })
    Clipboard.setString(address || '')
    Logger.showMessage(t('addressCopied'))
  }

  const onPressInfo = () => {
    ValoraAnalytics.track(FiatExchangeEvents.external_exchange_qr_bottom_sheet_open, {
      flow,
    })
    setBottomSheetVisible(true)
  }

  const onPressExchange = (exchange: ExternalExchangeProvider) => {
    ValoraAnalytics.track(FiatExchangeEvents.external_exchange_qr_bottom_sheet_link_press, {
      flow,
      exchange: exchange.name,
    })
  }

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TopBarIconButton testID="shareButton" icon={<Share />} onPress={onPressShare} />
      ),
    })
  }, [navigation])

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <StyledQRCode qrSvgRef={qrSvgRef} />
      </View>

      {displayName && (
        <Text
          style={[styles.name, fontStyles.displayName]}
          numberOfLines={1}
          ellipsizeMode="tail"
          testID="displayName"
        >
          {displayName}
        </Text>
      )}
      <Text testID="address" style={[fontStyles.mediumNumber, fontStyles.regular, styles.address]}>
        {address}
      </Text>
      <Button
        text={t('fiatExchangeFlow.exchange.copyAddress')}
        onPress={onPressCopy}
        icon={<Paste color={colors.white} />}
        iconPositionLeft={false}
        testID="copyButton"
      />

      <View style={styles.infoWrapper}>
        <Text style={[fontStyles.regular, styles.exchangeText]}>
          {t('fiatExchangeFlow.exchange.informationPartOne')}
          <Text
            testID="bottomSheetLink"
            style={[fontStyles.regular600, styles.link]}
            onPress={onPressInfo}
          >
            {t('fiatExchangeFlow.exchange.informationPartTwo')}
          </Text>
          {t('fiatExchangeFlow.exchange.informationPartThree')}
        </Text>
      </View>
      <ExchangesBottomSheet
        isVisible={!!bottomSheetVisible}
        onClose={onCloseBottomSheet}
        onExchangeSelected={onPressExchange}
        exchanges={exchanges}
      />
    </View>
  )
}

ExchangeQR.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.ExchangeQR>
}) => ({
  ...emptyHeader,
  headerLeft: () => (
    <BackButton
      eventName={FiatExchangeEvents.external_exchange_qr_back}
      eventProperties={{ flow: route.params.flow }}
    />
  ),
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatExchangeFlow.cashIn.depositExchangeTitle`)
      : i18n.t(`fiatExchangeFlow.cashOut.withdrawExchangeTitle`),
})

const styles = StyleSheet.create({
  infoWrapper: {
    position: 'absolute',
    bottom: 20,
    justifyContent: 'flex-end',
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  link: {
    textDecorationLine: 'underline',
    color: colors.greenUI,
    flexWrap: 'wrap',
  },
  qrContainer: {
    marginBottom: 20,
  },
  name: {
    marginHorizontal: variables.width / 4,
    marginBottom: 8,
  },
  address: {
    color: colors.gray5,
    marginHorizontal: variables.width / 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  exchangeText: {
    color: colors.gray5,
    marginHorizontal: 20,
    textAlign: 'center',
  },
})

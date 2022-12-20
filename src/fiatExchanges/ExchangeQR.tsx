import Clipboard from '@react-native-clipboard/clipboard'
import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { nameSelector } from 'src/account/selectors'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import Button from 'src/components/Button'
import ExchangesBottomSheet from 'src/components/ExchangesBottomSheet'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import i18n from 'src/i18n'
import Paste from 'src/icons/Paste'
import Share from 'src/icons/Share'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { QRCodeDataType } from 'src/qrcode/schema'
import StyledQRCode from 'src/qrcode/StyledQRCode'
import { shareQRCode, SVG } from 'src/send/actions'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'
import { CICOFlow } from './utils'

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
        <StyledQRCode dataType={QRCodeDataType.Address} qrSvgRef={qrSvgRef} />
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

      <Text style={[styles.infoWrapper, fontStyles.regular, styles.exchangeText]}>
        <Trans i18nKey="fiatExchangeFlow.exchange.informationText">
          <Text
            testID="bottomSheetLink"
            style={[fontStyles.regular600, styles.link]}
            onPress={onPressInfo}
          ></Text>
        </Trans>
      </Text>
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

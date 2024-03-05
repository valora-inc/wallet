import { RouteProp } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useRef } from 'react'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import i18n from 'src/i18n'
import Share from 'src/icons/Share'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import QRCode from 'src/qrcode/QRCode'
import { useDispatch } from 'src/redux/hooks'
import { SVG, shareQRCode } from 'src/send/actions'
import { CICOFlow } from './utils'

type Props = NativeStackScreenProps<StackParamList, Screens.ExchangeQR>

export default function ExchangeQR({ route, navigation }: Props) {
  const qrSvgRef = useRef<SVG>()
  const { flow, exchanges } = route.params
  const dispatch = useDispatch()

  const onPressShare = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_exchange_qr_share, {
      flow,
    })
    dispatch(shareQRCode(qrSvgRef.current))
  }

  const onCloseBottomSheet = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_exchange_qr_bottom_sheet_close, {
      flow,
    })
  }

  const onPressCopy = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_exchange_qr_copy_address, {
      flow,
    })
  }

  const onPressInfo = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_exchange_qr_bottom_sheet_open, {
      flow,
    })
  }

  const onPressExchange = (exchange: ExternalExchangeProvider) => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_exchange_qr_bottom_sheet_link_press, {
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
    <QRCode
      qrSvgRef={qrSvgRef}
      exchanges={exchanges}
      onCloseBottomSheet={onCloseBottomSheet}
      onPressCopy={onPressCopy}
      onPressInfo={onPressInfo}
      onPressExchange={onPressExchange}
    />
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
      eventName={FiatExchangeEvents.cico_exchange_qr_back}
      eventProperties={{ flow: route.params.flow }}
    />
  ),
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatExchangeFlow.cashIn.depositExchangeTitle`)
      : i18n.t(`fiatExchangeFlow.cashOut.withdrawExchangeTitle`),
})

import Clipboard from '@react-native-clipboard/clipboard'
import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { nameSelector } from 'src/account/selectors'
import Button from 'src/components/Button'
import ExchangesBottomSheet from 'src/components/ExchangesBottomSheet'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import Paste from 'src/icons/Paste'
import StyledQRCode from 'src/qrcode/StyledQRCode'
import { SVG } from 'src/send/actions'
import { QRCodeDataType } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  exchanges: ExternalExchangeProvider[]
  dataType: QRCodeDataType
  onCloseBottomSheet?: () => void
  onPressCopy?: () => void
  onPressInfo?: () => void
  onPressExchange?: (exchange: ExternalExchangeProvider) => void
}

export default function NewQRCodeDisplay(props: Props) {
  const { t } = useTranslation()
  const { exchanges, dataType, qrSvgRef } = props
  const address = useSelector(walletAddressSelector)
  const displayName = useSelector(nameSelector)

  const [bottomSheetVisible, setBottomSheetVisible] = useState(false)

  const onCloseBottomSheet = () => {
    props.onCloseBottomSheet?.()
    setBottomSheetVisible(false)
  }

  const onPressCopy = () => {
    props.onPressCopy?.()
    Clipboard.setString(address || '')
    Logger.showMessage(t('addressCopied'))
    vibrateInformative()
  }

  const onPressInfo = () => {
    props.onPressInfo?.()
    setBottomSheetVisible(true)
  }

  const onPressExchange = (exchange: ExternalExchangeProvider) => {
    props.onPressExchange?.(exchange)
  }

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <StyledQRCode dataType={dataType} qrSvgRef={qrSvgRef} />
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
    backgroundColor: colors.white,
  },
  link: {
    textDecorationLine: 'underline',
    color: colors.primary,
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

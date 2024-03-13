import Clipboard from '@react-native-clipboard/clipboard'
import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { nameSelector } from 'src/account/selectors'
import Button from 'src/components/Button'
import ExchangesBottomSheet from 'src/components/ExchangesBottomSheet'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import { ExternalExchangeProvider } from 'src/fiatExchanges/ExternalExchanges'
import CopyIcon from 'src/icons/CopyIcon'
import StyledQRCode from 'src/qrcode/StyledQRCode'
import { useSelector } from 'src/redux/hooks'
import { SVG } from 'src/send/actions'
import { NETWORK_NAMES } from 'src/shared/conts'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import variables from 'src/styles/variables'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  exchanges?: ExternalExchangeProvider[]
  onCloseBottomSheet?: () => void
  onPressCopy?: () => void
  onPressInfo?: () => void
  onPressExchange?: (exchange: ExternalExchangeProvider) => void
}

export default function QRCodeDisplay(props: Props) {
  const { t } = useTranslation()
  const { exchanges, qrSvgRef } = props
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

  const getSupportedNetworks = () => {
    const supportedNetworkIds = getDynamicConfigParams(
      DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
    ).showBalances
    const networks = supportedNetworkIds.map((networkId: NetworkId) => {
      return NETWORK_NAMES[networkId]
    })
    return networks.join(', ')
  }

  const description = () => (
    <Text style={styles.description}>
      <Trans
        i18nKey={'fiatExchangeFlow.exchange.informational'}
        tOptions={{ networks: getSupportedNetworks() }}
      >
        <Text style={styles.bold} />
      </Trans>
    </Text>
  )

  return (
    <View style={styles.container}>
      <View testID="QRCode" style={styles.qrContainer}>
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
        icon={<CopyIcon color={colors.white} />}
        iconMargin={12}
        iconPositionLeft={false}
        testID="copyButton"
      />

      {exchanges ? (
        <>
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
        </>
      ) : (
        <View style={styles.notificationWrapper}>
          <InLineNotification
            variant={NotificationVariant.Info}
            description={description()}
            style={styles.link}
            testID="supportedNetworksNotification"
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  infoWrapper: {
    position: 'absolute',
    bottom: 20,
    justifyContent: 'flex-end',
  },
  notificationWrapper: {
    position: 'absolute',
    bottom: 20,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 16,
  },
  bold: {
    ...typeScale.labelSemiBoldXSmall,
  },
  description: {
    ...typeScale.bodyXSmall,
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

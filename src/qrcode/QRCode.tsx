import Clipboard from '@react-native-clipboard/clipboard'
import React, { useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
import { getMultichainFeatures } from 'src/statsig'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
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

  const insets = useSafeAreaInsets()

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
    const supportedNetworkIds = getMultichainFeatures().showBalances
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

      {!!displayName && (
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail" testID="displayName">
          {displayName}
        </Text>
      )}
      <Text testID="address" style={styles.address}>
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

      <View
        style={[
          styles.bottomContent,
          {
            marginBottom: Math.max(Spacing.Thick24, insets.bottom),
          },
        ]}
      >
        {exchanges && exchanges.length > 0 ? (
          <>
            <Text style={styles.exchangeText}>
              <Trans i18nKey="fiatExchangeFlow.exchange.informationText">
                <Text testID="bottomSheetLink" style={styles.link} onPress={onPressInfo}></Text>
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
          <InLineNotification
            variant={NotificationVariant.Info}
            description={description()}
            style={styles.link}
            testID="supportedNetworksNotification"
          />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: Spacing.Regular16,
    width: '100%',
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
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  link: {
    ...typeScale.labelSemiBoldMedium,
    textDecorationLine: 'underline',
    color: colors.primary,
    flexWrap: 'wrap',
  },
  qrContainer: {
    marginTop: '35%',
    marginBottom: Spacing.Thick24,
  },
  name: {
    ...typeScale.labelSemiBoldMedium,
    marginHorizontal: variables.width / 5,
    marginBottom: 8,
  },
  address: {
    ...typeScale.bodyMedium,
    color: colors.gray5,
    marginHorizontal: variables.width / 5,
    marginBottom: 8,
    textAlign: 'center',
  },
  exchangeText: {
    ...typeScale.bodyMedium,
    color: colors.gray5,
    textAlign: 'center',
  },
})

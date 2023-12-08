import Clipboard from '@react-native-clipboard/clipboard'
import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { nameSelector } from 'src/account/selectors'
import Button from 'src/components/Button'
import InLineNotification, { Severity } from 'src/components/InLineNotification'
import CopyIcon from 'src/icons/CopyIcon'
import StyledQRCode from 'src/qrcode/StyledQRCode'
import { SVG } from 'src/send/actions'
import { getDynamicConfigParams } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { vibrateInformative } from 'src/styles/hapticFeedback'
import variables from 'src/styles/variables'
import { NetworkId } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  onPressCopy?: () => void
}

export default function QRCodeDisplay(props: Props) {
  const { t } = useTranslation()
  const { qrSvgRef } = props
  const address = useSelector(walletAddressSelector)
  const displayName = useSelector(nameSelector)

  const onPressCopy = () => {
    props.onPressCopy?.()
    Clipboard.setString(address || '')
    Logger.showMessage(t('addressCopied'))
    vibrateInformative()
  }

  const getSupportedNetworks = () => {
    const supportedNetworkIds = getDynamicConfigParams(
      DynamicConfigs[StatsigDynamicConfigs.MULTI_CHAIN_FEATURES]
    ).showBalances
    const networks = supportedNetworkIds.map((id: NetworkId) => {
      const network = networkIdToNetwork[id]
      return network.charAt(0).toUpperCase() + network.slice(1)
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
        iconPositionLeft={false}
        testID="copyButton"
      />

      <View style={styles.infoWrapper}>
        <InLineNotification
          severity={Severity.SoftInformational}
          description={description()}
          style={styles.link}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  infoWrapper: {
    position: 'absolute',
    bottom: 20,
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 16,
  },
  bold: {
    fontWeight: 'bold',
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
})

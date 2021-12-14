import TextButton from '@celo/react-components/components/TextButton'
import Share from '@celo/react-components/icons/Share'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { shallowEqual, useSelector } from 'react-redux'
import { AvatarSelf } from 'src/components/AvatarSelf'
import QRCode from 'src/qrcode/QRGen'
import { UriData, urlFromUriData } from 'src/qrcode/schema'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
}

const mapStateToProps = (state: RootState): Partial<UriData> => ({
  address: currentAccountSelector(state)!,
  displayName: state.account.name || undefined,
  e164PhoneNumber: state.account.e164PhoneNumber || undefined,
})

export default function QRCodeDisplay({ qrSvgRef }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useMemo(() => urlFromUriData(data), [
    data.address,
    data.displayName,
    data.e164PhoneNumber,
  ])

  const onPressCopyAddress = () => {
    // todo: actually setting the address to clipboard
    Logger.showMessage('address copied to clipboard')
  }
  const onPressShare = () => {}

  return (
    <SafeAreaView style={styles.container}>
      <AvatarSelf iconSize={64} displayNameStyle={fontStyles.h2} />
      <TextButton style={styles.copyAddressButton} onPress={onPressCopyAddress}>
        Copy Address
      </TextButton>
      <View style={styles.qrContainer}>
        <QRCode value={qrContent} size={variables.width / 2} svgRef={qrSvgRef} />
        <TouchableOpacity onPress={onPressShare}>
          <View style={styles.shareButton}>
            <Share />
            <Text style={styles.shareText}>Share</Text>
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.light,
  },
  qrContainer: {
    paddingTop: 16,
  },
  copyAddressButton: {
    marginBottom: 56,
  },
  shareButton: {
    paddingTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 24,
    // backgroundColor: colors.beige,
    color: colors.dark,
  },
  shareText: {
    ...fontStyles.iconText,
    color: colors.greenUI,
    paddingLeft: 4,
  },
})

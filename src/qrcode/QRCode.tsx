import React from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { shallowEqual, useSelector } from 'react-redux'
import { nameSelector } from 'src/account/selectors'
import { AvatarSelf } from 'src/components/AvatarSelf'
import QRCode from 'src/qrcode/QRGen'
import { useQRContent } from 'src/qrcode/utils'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import { QRCodeDataType } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  dataType: QRCodeDataType
}

export const mapStateToProps = (state: RootState) => ({
  address: currentAccountSelector(state)!,
  displayName: nameSelector(state) || undefined,
  e164PhoneNumber: state.account.e164PhoneNumber || undefined,
})

export default function QRCodeDisplay({ qrSvgRef, dataType }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useQRContent(dataType, data)
  return (
    <SafeAreaView style={styles.container}>
      <AvatarSelf iconSize={64} displayNameStyle={fontStyles.h2} />
      <View testID="QRCode" style={styles.qrContainer}>
        <QRCode value={qrContent} size={variables.width / 2} svgRef={qrSvgRef} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  qrContainer: {
    paddingTop: 16,
  },
})

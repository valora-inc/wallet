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
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { currentAccountSelector } from 'src/web3/selectors'
import { Statsig } from 'statsig-react-native'
import { QRCodeAppearance, QRCodeDataType, StatsigLayers } from 'src/statsig/types'
import { LayerParams } from 'src/statsig/constants'
import Logger from 'src/utils/Logger'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  dataType: QRCodeDataType
}

const TAG = 'QRCode'

function getExperimentParams(): {
  qrCodeAppearance: QRCodeAppearance
  qrCodeData: QRCodeDataType
} {
  const layerName = StatsigLayers.SEND_RECEIVE_QR_CODE
  const { paramName: appearanceParamName, defaultValue: appearanceDefaultValue } =
    LayerParams[layerName].qrCodeAppearance
  const { paramName: dataParamName, defaultValue: dataDefaultValue } =
    LayerParams[layerName].qrCodeData
  try {
    const statsigLayer = Statsig.getLayer(layerName)
    const qrCodeAppearance = statsigLayer.get(appearanceParamName, appearanceDefaultValue)
    const qrCodeData = statsigLayer.get(dataParamName, dataDefaultValue)
    return { qrCodeAppearance, qrCodeData }
  } catch (error) {
    Logger.warn(TAG, 'error getting Statsig experiment', error)
    return {
      qrCodeAppearance: appearanceDefaultValue,
      qrCodeData: dataDefaultValue,
    }
  }
}

export const mapStateToProps = (state: RootState) => ({
  address: currentAccountSelector(state)!,
  displayName: nameSelector(state) || undefined,
  e164PhoneNumber: state.account.e164PhoneNumber || undefined,
})

export default function QRCodeDisplay({ qrSvgRef, dataType }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useQRContent(dataType, data)
  Logger.debug(TAG, `experiment params: ${JSON.stringify(getExperimentParams())}`)
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
    backgroundColor: colors.light,
  },
  qrContainer: {
    paddingTop: 16,
  },
})

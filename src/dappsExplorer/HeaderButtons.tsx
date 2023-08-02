import React from 'react'
import { StyleSheet, View } from 'react-native'
import QrScanButton from 'src/components/QrScanButton'
import Help from 'src/icons/Help'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { getExperimentParams } from 'src/statsig'
import { ExperimentConfigs } from 'src/statsig/constants'
import { StatsigExperiments } from 'src/statsig/types'
import colors from 'src/styles/colors'

interface Props {
  onPressHelp: () => void
  helpIconColor?: colors
  testID: string
}

export default function HeaderButtons({ onPressHelp, testID, helpIconColor }: Props) {
  const { showQrScanner } = getExperimentParams(
    ExperimentConfigs[StatsigExperiments.HOME_SCREEN_ACTIONS]
  )

  return (
    <View style={styles.headerButtons}>
      {showQrScanner && (
        <QrScanButton style={styles.qrScanButton} testID={`${testID}/QRScanButton`} />
      )}
      <TopBarIconButton
        testID={`${testID}/HelpIcon`}
        icon={<Help color={helpIconColor} />}
        onPress={onPressHelp}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  headerButtons: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrScanButton: {
    paddingRight: 15,
  },
})

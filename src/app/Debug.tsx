import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { e164NumberSelector, pincodeTypeSelector } from 'src/account/selectors'
import Button, { BtnTypes } from 'src/components/Button'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { useSelector } from 'src/redux/hooks'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { Statsig } from 'statsig-react-native'

export function Debug() {
  const onClickText = (...text: Array<string | null>) => {
    return () => {
      Logger.showMessage('Copied to Clipboard')
      Clipboard.setString(text.join(', '))
    }
  }

  const onClickEmailLogs = () => {
    navigate(Screens.SupportContact)
  }

  const pincodeType = useSelector(pincodeTypeSelector)
  const address = useSelector(currentAccountSelector)
  const phoneNumber = useSelector(e164NumberSelector)
  const version = DeviceInfo.getVersion()
  const buildNumber = DeviceInfo.getBuildNumber()
  const apiLevel = DeviceInfo.getApiLevelSync()
  const deviceId = DeviceInfo.getDeviceId()
  const stableId = Statsig.getStableID()

  return (
    <SafeAreaView style={styles.container}>
      <Text
        onPress={onClickText(deviceId, phoneNumber)}
        style={styles.singleLine}
      >{`Device Id: ${deviceId} | Phone Number: ${phoneNumber}`}</Text>
      <Text
        onPress={onClickText(version, buildNumber, String(apiLevel))}
        style={styles.singleLine}
      >{`Version: ${version} | Build Number: ${buildNumber} | Api Level: ${apiLevel}`}</Text>
      <Text style={styles.singleLine}>{`Pin Type: ${pincodeType}`}</Text>
      <Text onPress={onClickText(address)} style={styles.singleLine}>{`Address: ${address}`}</Text>
      <Text onPress={onClickText(stableId)} style={styles.singleLine}>
        {`Statsig Stable ID: ${stableId}`}
      </Text>
      <Button
        onPress={onClickEmailLogs}
        text={'Email logs to support'}
        type={BtnTypes.PRIMARY}
        style={styles.button}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  singleLine: {
    marginTop: 5,
    fontSize: 11,
  },
  button: {
    marginHorizontal: 0,
    marginTop: 10,
    marginBottom: 0,
  },
})

export default connect<RootState, {}, {}, RootState>((state: RootState) => state)(Debug)

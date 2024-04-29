import Clipboard from '@react-native-clipboard/clipboard'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import Button, { BtnTypes } from 'src/components/Button'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'
import { getLatestBlock } from 'src/web3/utils'
import { Statsig } from 'statsig-react-native'

interface State {
  latestBlockNumber: number
}

export class Debug extends React.Component<RootState, State> {
  static navigationOptions = noHeader

  state = {
    latestBlockNumber: 0,
  }

  async componentDidMount() {
    await this.updateLatestBlock()
  }

  updateLatestBlock = async () => {
    const latestBlock = await getLatestBlock()
    this.setState({
      latestBlockNumber: (latestBlock && latestBlock.number) || 0,
    })
  }

  onClickText = (...text: Array<string | null>) => {
    return () => {
      Logger.showMessage('Copied to Clipboard')
      Clipboard.setString(text.join(', '))
    }
  }

  onClickEmailLogs = async () => {
    navigate(Screens.SupportContact)
  }

  render() {
    const { latestBlockNumber } = this.state
    const pincodeType = this.props.account.pincodeType
    const address = currentAccountSelector(this.props)
    const phoneNumber = this.props.account.e164PhoneNumber
    const version = DeviceInfo.getVersion()
    const buildNumber = DeviceInfo.getBuildNumber()
    const apiLevel = DeviceInfo.getApiLevelSync()
    const deviceId = DeviceInfo.getDeviceId()
    const stableId = Statsig.getStableID()

    return (
      <SafeAreaView style={styles.container}>
        <Text
          onPress={this.onClickText(deviceId, phoneNumber)}
          style={styles.singleLine}
        >{`Device Id: ${deviceId} | Phone Number: ${phoneNumber}`}</Text>
        <Text
          onPress={this.onClickText(version, buildNumber, String(apiLevel))}
          style={styles.singleLine}
        >{`Version: ${version} | Build Number: ${buildNumber} | Api Level: ${apiLevel}`}</Text>
        <Text style={styles.singleLine}>{`Pin Type: ${pincodeType}`}</Text>
        <Text
          onPress={this.onClickText(address)}
          style={styles.singleLine}
        >{`Address: ${address}`}</Text>
        <Text onPress={this.onClickText(stableId)} style={styles.singleLine}>
          {`Statsig Stable ID: ${stableId}`}
        </Text>
        <Text style={styles.singleLine}>{`Latest Block: ${latestBlockNumber}`}</Text>
        <Button
          onPress={this.onClickEmailLogs}
          text={'Email logs to support'}
          type={BtnTypes.PRIMARY}
          style={styles.button}
        />
      </SafeAreaView>
    )
  }
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

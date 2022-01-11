import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'

mockRNDeviceInfo.getBundleId.mockImplementation(() => 'org.celo.mobile.debug')
mockRNDeviceInfo.getVersion.mockImplementation(() => '0.0.1')
mockRNDeviceInfo.getBuildNumber.mockImplementation(() => '1')
mockRNDeviceInfo.getUniqueId.mockImplementation(() => 'abc-def-123')

export default mockRNDeviceInfo

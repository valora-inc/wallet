import ReactNative from 'react-native'

const { GooglePlayServicesAvailabilityModule } = ReactNative.NativeModules

export async function isGooglePlayServicesAvailable(): Promise<string> {
  return await GooglePlayServicesAvailabilityModule.isGooglePlayServicesAvailable()
}

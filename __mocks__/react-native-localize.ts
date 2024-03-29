import { NativeModules } from 'react-native'

NativeModules.RNLocalize = {
  initialConstants: {
    locales: [
      {
        languageCode: 'en',
        countryCode: 'US',
        languageTag: 'en-US',
        isRTL: false,
      },
    ],
    currencies: ['MXN', 'USD'],
    country: 'US',
  },
}

module.exports = {
  ...jest.requireActual('react-native-localize'),
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
  getTimeZone: jest.fn(() => 'America/New_York'),
  findBestAvailableLanguage: jest.fn(() => ({ languageTag: 'en-US', isRTL: true })),
}

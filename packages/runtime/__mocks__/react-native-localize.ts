module.exports = {
  getNumberFormatSettings: jest.fn(() => ({
    decimalSeparator: '.',
    groupingSeparator: ',',
  })),
  getTimeZone: jest.fn(() => 'America/New_York'),
  findBestLanguageTag: jest.fn(() => ({ languageTag: 'en-US', isRTL: true })),
  getCountry: jest.fn(() => 'US'),
  getCurrencies: jest.fn(() => ['MXN', 'USD']),
  getLocales: jest.fn(() => [
    {
      languageCode: 'en',
      countryCode: 'US',
      languageTag: 'en-US',
      isRTL: false,
    },
  ]),
}

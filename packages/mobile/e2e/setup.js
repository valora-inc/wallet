import { setDemoMode } from './src/utils/utils'

beforeAll(async () => {
  await device.launchApp({
    permissions: { notifications: 'YES', contacts: 'YES' },
    launchArgs: {
      detoxURLBlacklistRegex:
        '\\("https://blockchain-api-dot-celo-mobile-alfajores.appspot.com/","https://alfajores-forno.celo-testnet.org/", "https://alfajores-stokado-data.celo-testnet.org/*"\\)',
    },
  })
})

beforeEach(async () => {
  device.setURLBlacklist([
    'https://blockchain-api-dot-celo-mobile-alfajores.appspot.com',
    'https://alfajores-forno.celo-testnet.org/',
  ])
})

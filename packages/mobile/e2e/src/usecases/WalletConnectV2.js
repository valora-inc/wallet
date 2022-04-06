import WalletConnectClient, { CLIENT_EVENTS } from '@walletconnect/client'
import { formatUri } from '../utils/encoding'
import { scrollIntoView, sleep } from '../utils/utils'

const WalletConnectAPIKey = process.env.WALLET_CONNECT_API_KEY || ''
let uri, walletConnector

export default WalletConnect = () => {
  beforeAll(async () => {
    await reloadReactNative()
    // Create connector
    walletConnector = await WalletConnectClient.init({
      relayProvider: 'wss://relay.walletconnect.com',
      apiKey: WalletConnectAPIKey,
      metadata: {
        name: 'WalletConnectV2 E2E',
        description: 'WalletConnect Client',
        url: 'https://valoraapp.com/',
        icons: [],
      },
    })

    // Get uri when present
    walletConnector.on(CLIENT_EVENTS.pairing.proposal, async (proposal) => {
      uri = proposal.signal.params
    })

    // Connect
    walletConnector.connect({
      permissions: {
        blockchain: {
          chains: ['eip155:44787'],
        },
        jsonrpc: {
          methods: ['eth_sendTransaction', 'personal_sign', 'eth_signTypedData'],
        },
      },
    })
  })

  it('Then is able to establish a session', async () => {
    await sleep(2 * 1000)
    await device.openURL({ url: formatUri(uri) })
  })

  // TODO - Add the tests below
  // Then is able to send a transaction (eth_sendTransaction)
  // Then is able to sign a transaction
  // Then is able to sign a personal message (personal_sign)
  // Then is able to sign message (eth_sign)
  // Then is able to sign typed data (eth_signTypedData)
  // Then is able to send custom request

  it('Then should be able to disconnect a session', async () => {
    // Tap Hamburger
    await element(by.id('Hamburger')).tap()

    // Scroll to settings
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('Settings')).tap()
    await element(by.id('ConnectedApplications')).tap()
    await element(by.text('Tap to Disconnect')).tap()
    await element(by.text('Disconnect')).tap()
    await expect(element(by.id('ConnectedApplications/value'))).toHaveText('0')
  })
}

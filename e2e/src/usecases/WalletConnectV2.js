import { newKit } from '@celo/contractkit'
import Client from '@walletconnect/sign-client'
import fetch from 'node-fetch'
import { formatUri } from '../utils/encoding'
import { enterPinUiIfNecessary, scrollIntoView, waitForElementId } from '../utils/utils'

const jestExpect = require('expect')

const dappName = 'WalletConnectV2 E2E'
const DEFAULT_PROJECT_ID =
  process.env.WALLET_CONNECT_PROJECT_ID || 'b8620cf33f99d407708c298d68224d8a'

const kitUrl = process.env.FORNO_URL || 'https://alfajores-forno.celo-testnet.org'
const kit = newKit(kitUrl)

const walletAddress = (
  process.env.E2E_WALLET_ADDRESS || '0x6131a6d616a4be3737b38988847270a64bc10caa'
).toLowerCase()

async function formatTestTransaction(address) {
  try {
    const response = await fetch(kitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
        id: 1,
      }),
    })
    const data = await response.json()

    return {
      from: address,
      to: address,
      data: '0x',
      nonce: parseInt(data.result, 16),
      gasPrice: '0x02540be400',
      gasLimit: '0x5208',
      value: '0x00',
    }
  } catch (error) {
    throw new Error(`Failed to create test tx with error ${error.toString()}`)
  }
}

let walletConnectClient, pairingUrl
const initialiseClient = async () => {
  walletConnectClient = await Client.init({
    relayUrl: 'wss://relay.walletconnect.org',
    projectId: DEFAULT_PROJECT_ID,
    metadata: {
      name: dappName,
      description: 'WalletConnect Client',
      url: 'https://valoraapp.com/',
      icons: [],
    },
  })

  const { uri } = await walletConnectClient.connect({
    requiredNamespaces: {
      eip155: {
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData',
        ],
        chains: ['eip155:44787'],
        events: ['chainChanged', 'accountsChanged'],
      },
    },
  })

  pairingUrl = uri
}

const verifySuccessfulConnection = async () => {
  await waitFor(element(by.text(`Success! Please go back to ${dappName} to continue`)))
    .toBeVisible()
    .withTimeout(15 * 1000)
  await waitFor(element(by.id('SendOrRequestBar')))
    .toBeVisible()
    .withTimeout(15 * 1000)
}

export default WalletConnect = () => {
  beforeAll(async () => {
    await initialiseClient()
  })

  it('Then is able to establish a session', async () => {
    await device.openURL({ url: formatUri(pairingUrl) })

    await waitFor(element(by.id('WalletConnectSessionRequestHeader')))
      .toBeVisible()
      .withTimeout(30 * 1000)

    await element(by.text('Allow')).tap()
    await verifySuccessfulConnection()
  })

  it('Then is able to send a transaction (eth_sendTransaction)', async () => {
    let txHash
    const tx = await formatTestTransaction(walletAddress)
    const [session] = walletConnectClient.session.map.values()
    walletConnectClient
      .request({
        topic: session.topic,
        chainId: 'eip155:44787',
        request: {
          method: 'eth_sendTransaction',
          params: [tx],
        },
      })
      .then((result) => {
        txHash = result
      })

    await waitFor(element(by.text(`${dappName} would like to confirm a transaction`)))
      .toBeVisible()
      .withTimeout(15 * 1000)

    await element(by.id('ShowTransactionDetailsButton')).tap()
    await expect(element(by.id('DappData'))).toHaveText(`[${JSON.stringify(tx)}]`)

    await element(by.id('WalletConnectActionRequest/Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await verifySuccessfulConnection()

    // Wait for transaction and get receipt
    const { status, from, to } = await kit.connection.getTransactionReceipt(txHash)

    jestExpect(status).toStrictEqual(true)
    jestExpect(from).toStrictEqual(walletAddress)
    jestExpect(to).toStrictEqual(walletAddress)
  })

  // TODO - Add the tests below
  // Then is able to sign a transaction
  // Then is able to sign a personal message (personal_sign)
  // Then is able to sign message (eth_sign)
  // Then is able to sign typed data (eth_signTypedData)
  // Then is able to send custom request

  it('Then should be able to disconnect a session', async () => {
    await waitForElementId('Hamburger')
    await element(by.id('Hamburger')).tap()

    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitForElementId('Settings')
    await element(by.id('Settings')).tap()
    await element(by.id('ConnectedApplications')).tap()
    await element(by.text('Tap to Disconnect')).tap()
    await element(by.text('Disconnect')).tap()
    await element(by.id('BackChevron')).tap()
    await expect(element(by.id('ConnectedApplications/value'))).toHaveText('0')
  })
}

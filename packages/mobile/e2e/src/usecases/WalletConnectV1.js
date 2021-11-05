import NodeWalletConnect from '@walletconnect/node'
import { dismissBanners } from '../utils/banners'
import { enterPinUiIfNecessary, sleep, utf8ToHex, scrollIntoView } from '../utils/utils'

export default WalletConnect = () => {
  const keccak256 = require('keccak256')
  let uri, walletConnector, tx

  beforeAll(async () => {
    await device.reloadReactNative()
    // Create connector
    walletConnector = new NodeWalletConnect(
      {
        bridge: 'https://bridge.walletconnect.org', // Required
      },
      {
        clientMeta: {
          description: 'WalletConnect NodeJS Client',
          url: 'https://valoraapp.com/',
          icons: [],
          name: 'WalletConnectV1 E2E',
        },
      }
    )

    await walletConnector.createSession()
    // Shared across tests specs
    uri = walletConnector.uri
    tx = {
      from: '0x6131a6d616a4be3737b38988847270a64bc10caa', // Required
      to: '0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846', // Required (for non contract deployments)
      data: '0x', // Required
      gasPrice: '0x02540be400', // Optional
      gas: '0x9c40', // Optional
      value: '0x00', // Optional
      nonce: '0x0114', // Optional
    }
  })

  afterAll(async () => {
    await walletConnector.transportClose()
  })

  it('Then is able to establish a session', async () => {
    await sleep(2 * 1000)
    await device.openURL({ url: uri })
    await dismissBanners()
    await waitFor(element(by.text('WalletConnectV1 E2E would like to connect to Valora')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Allow')).tap()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('Then is able to send a transaction (eth_sendTransaction)', async () => {
    await sleep(2 * 1000)
    walletConnector.sendTransaction(tx)
    await waitFor(element(by.text('Send a Celo TX')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    // TODO: assert on data
    await element(by.text('Allow')).tap()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  // TODO(tom): investigate failing
  it.skip('Then is able to sign a transaction', async () => {
    await sleep(2 * 1000)
    walletConnector.signTransaction(tx)
    await waitFor(element(by.text('Sign a Celo TX')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Allow')).tap()
    await enterPinUiIfNecessary()
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('Then is able to sign a personal message (personal_sign)', async () => {
    const message = `My email is valora.test@mailinator.com - ${+new Date()}`
    const msgParams = [
      // Both Required
      utf8ToHex(message),
      '0x6131a6d616a4be3737b38988847270a64bc10caa',
    ]
    await sleep(2 * 1000)
    walletConnector.signPersonalMessage(msgParams)
    await waitFor(element(by.text('Sign a data payload')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Allow')).tap()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('Then is able to sign message (eth_sign)', async () => {
    const message = `My email is valora.test@mailinator.com - ${+new Date()}`
    const msgParams = [
      '0x6131a6d616a4be3737b38988847270a64bc10caa',
      keccak256('\x19Ethereum Signed Message:\n' + message.length + message),
    ]
    await sleep(2 * 1000)
    walletConnector.signMessage(msgParams)
    await waitFor(element(by.text('Sign a data payload')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Allow')).tap()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  // TODO(tom): investigate failing
  it.skip('Then is able to sign typed data (eth_signTypedData)', async () => {
    const typedData = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'address' },
        ],
        Person: [
          { name: 'name', type: 'string' },
          { name: 'account', type: 'address' },
        ],
        Mail: [
          { name: 'from', type: 'Person' },
          { name: 'to', type: 'Person' },
          { name: 'contents', type: 'string' },
        ],
      },
      primaryType: 'Mail',
      domain: {
        name: 'Example Dapp',
        version: '1.0',
        chainId: 1,
        verifyingContract: '0x0000000000000000000000000000000000000000',
      },
      message: {
        from: {
          name: 'Alice',
          account: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        },
        to: {
          name: 'Bob',
          account: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
        contents: 'Hey, Bob!',
      },
    }

    const msgParams = ['0x6131a6d616a4be3737b38988847270a64bc10caa', typedData]

    await sleep(2 * 1000)
    walletConnector.signTypedData(msgParams)
    await waitFor(element(by.text('Sign a data payload')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Allow')).tap()
    await enterPinUiIfNecessary()
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  // TODO(tom): investigate failing
  it.skip('Then is able to send custom request', async () => {
    const customRequest = {
      id: 1337,
      jsonrpc: '2.0',
      method: 'eth_signTransaction',
      params: [
        {
          from: '0x6131a6d616a4be3737b38988847270a64bc10caa',
          to: '0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846',
          data: '0x',
          gasPrice: '0x02540be400',
          gas: '0x9c40',
          value: '0x00',
          nonce: '0x0114',
        },
      ],
    }

    await sleep(2 * 1000)
    walletConnector.sendCustomRequest(customRequest)
    await waitFor(element(by.text('Sign a Celo TX')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.text('Allow')).tap()
    await enterPinUiIfNecessary()
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(10 * 1000)
  })

  it('Then should be able to disconnect a session', async () => {
    await sleep(2 * 1000)

    // Tap Hamburger
    await element(by.id('Hamburger')).tap()

    // Scroll to settings
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(10 * 1000)
    await element(by.id('Settings')).tap()
    await element(by.text('Connected Apps')).tap()
    await element(by.text('Tap to Disconnect')).tap()
    await element(by.text('Disconnect')).tap()
    await waitFor(element(by.text('Tap to Disconnect')))
      .not.toBeVisible()
      .withTimeout(10 * 1000)
  })

  // TODO (tom): Write tests for
  // eth_accounts
  // personal_decrypt
  // computeSharedSecret
}

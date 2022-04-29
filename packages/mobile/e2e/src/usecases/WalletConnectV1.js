import { newKit } from '@celo/contractkit'
import { hashMessageWithPrefix, verifySignature } from '@celo/utils/lib/signatureUtils'
import NodeWalletConnect from '@walletconnect/node'
import { formatUri, utf8ToHex } from '../utils/encoding'
import { launchApp, reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, isElementVisible, scrollIntoView, sleep } from '../utils/utils'

const fromAddress = (
  process.env.E2E_WALLET_ADDRESS || '0x6131a6d616a4be3737b38988847270a64bc10caa'
).toLowerCase()
const toAddress = (
  process.env.E2E_FAUCET_ADDRESS || '0xe5F5363e31351C38ac82DBAdeaD91Fd5a7B08846'
).toLowerCase()
const kitUrl = process.env.FORNO_URL || 'https://alfajores-forno.celo-testnet.org'
const kit = newKit(kitUrl)
const jestExpect = require('expect')
let uri, walletConnector, tx

export default WalletConnect = () => {
  beforeAll(async () => {
    await reloadReactNative()

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
    uri = formatUri(walletConnector.uri)
    tx = {
      from: fromAddress, // Required
      to: toAddress, // Required (for non contract deployments)
      value: '0x1', // Optional
      data: '0x', // Required
    }
  })

  beforeEach(async () => {
    // Sleep a few seconds for runs in ci
    await sleep(3 * 1000)
  })

  // Used to prevent a failing test spec form failing the entire test suite
  afterEach(async () => {
    // If on details page go back
    let backChevronPresent = await isElementVisible('BackChevron')
    if (backChevronPresent) {
      await element(by.id('BackChevron')).tap()
    }
    // Cancel pending wc action
    let closeIconPresent = await isElementVisible('Times')
    if (closeIconPresent) {
      await element(by.id('Times')).tap()
    }
  })

  afterAll(async () => {
    await walletConnector.transportClose()
  })

  it('Then should be able to establish a session', async () => {
    // Launching in Android requires use of launchApp
    if (device.getPlatform() === 'android') {
      await device.terminateApp()
      await sleep(5 * 1000)
      await launchApp({ url: uri, newInstance: true })
      await sleep(10 * 1000)
    } else {
      await sleep(2 * 1000)
      await device.openURL({ url: uri })
    }

    // A sleep for ci
    await sleep(3 * 1000)

    // Verify WC page
    await waitFor(element(by.id('SessionRequestHeader')))
      .toBeVisible()
      .withTimeout(30 * 1000)

    // Allow and verify UI behavior
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()
  })

  it('Then is able to send a transaction (eth_sendTransaction)', async () => {
    // Save result and await for it later
    let result = walletConnector.sendTransaction(tx)

    // Verify transaction type text
    await waitFor(element(by.text('Send a Celo TX')))
      .toBeVisible()
      .withTimeout(15 * 1000)

    // View and assert on Data - TODO Move to Component Tests
    await element(by.text('Show details')).tap()
    await expect(element(by.id('Dapp-Data'))).toHaveText(`[${JSON.stringify(tx)}]`)
    await element(by.id('BackChevron')).tap()

    // Accept and verify UI behavior
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()

    // Wait for transaction and get receipt
    let txHash = await result
    let txReceipt = await kit.connection.getTransactionReceipt(txHash)

    // Assert on transaction receipt
    jestExpect(txReceipt.status).toStrictEqual(true)
    jestExpect(txReceipt.from).toStrictEqual(fromAddress)
    jestExpect(txReceipt.to).toStrictEqual(toAddress)
  })

  // TODO: Enable when Valora implantation defect is fixed - gas can be optional is resolved
  // https://github.com/valora-inc/wallet/issues/1559

  it('Then is able to sign a transaction', async () => {
    // Save result and await for it later
    let result = walletConnector.signTransaction(tx)
    await waitFor(element(by.text('Sign a Celo TX')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()
  })

  it('Then is able to sign a personal message (personal_sign)', async () => {
    const message = `My email is valora.test@mailinator.com - ${+new Date()}`
    const msgParams = [
      // Both Required
      utf8ToHex(message),
      fromAddress,
    ]
    let result = walletConnector.signPersonalMessage(msgParams)
    await waitFor(element(by.text('Sign a data payload')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()

    // Wait for signature
    let signature = await result

    // Verify the signature
    const valid = verifySignature(message, signature, fromAddress)
    const invalid = verifySignature(message, signature, toAddress)
    jestExpect(valid).toStrictEqual(true)
    jestExpect(invalid).toStrictEqual(false)
  })

  // TODO: Check if verifySignature should check the hashed message or not

  it('Then is able to sign message (eth_sign)', async () => {
    const message = hashMessageWithPrefix(`My email is valora.test@mailinator.com - ${+new Date()}`)
    const msgParams = [fromAddress, message]
    let result = walletConnector.signMessage(msgParams)
    await waitFor(element(by.text('Sign a data payload')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()

    // Wait for signature
    let signature = await result

    // Verify the signature
    const valid = verifySignature(message, signature, fromAddress)
    const invalid = verifySignature(message, signature, toAddress)
    jestExpect(valid).toStrictEqual(true)
    jestExpect(invalid).toStrictEqual(false)
  })

  // TODO: Investigate failing

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

    const msgParams = [fromAddress, JSON.stringify(typedData)]

    let result = walletConnector.signTypedData(msgParams)
    await waitFor(element(by.text('Sign a data payload')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()

    // Wait for signature
    let signature = await result

    // Verify the signature - currently both return valid
    const valid = verifySignature(JSON.stringify(typedData), signature, fromAddress)
    const invalid = verifySignature(JSON.stringify(typedData), signature, toAddress)
    jestExpect(valid).toStrictEqual(true)
    jestExpect(invalid).toStrictEqual(false)
  })

  // TODO: Investigate failing

  it.skip('Then is able to send custom request', async () => {
    const customRequest = {
      id: 1337,
      jsonrpc: '2.0',
      method: 'eth_signTransaction',
      params: [
        {
          from: fromAddress,
          to: toAddress,
          data: '0x',
          gasPrice: '0x02540be400',
          gas: '0x9c40',
          value: '0x1',
          nonce: '0x0114',
        },
      ],
    }

    let result = walletConnector.sendCustomRequest(customRequest)
    await waitFor(element(by.text('Sign a Celo TX')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.text('Allow')).tap()
    await device.disableSynchronization()
    await enterPinUiIfNecessary()
    await waitFor(element(by.text('Success! Please go back to WalletConnectV1 E2E to continue')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await waitFor(element(by.id('SendOrRequestBar')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await device.enableSynchronization()

    // Wait for signature
    let signature = await result
  })

  it('Then is able to disconnect a session', async () => {
    // A sleep for ci
    await sleep(3 * 1000)

    // Wait for hamburger to be visible
    await waitFor(element(by.id('Hamburger')))
      .toBeVisible()
      .withTimeout(15 * 1000)

    // Tap Hamburger
    await element(by.id('Hamburger')).tap()

    // Scroll to settings
    await scrollIntoView('Settings', 'SettingsScrollView')
    await waitFor(element(by.id('Settings')))
      .toBeVisible()
      .withTimeout(15 * 1000)
    await element(by.id('Settings')).tap()
    await element(by.id('ConnectedApplications')).tap()
    await element(by.text('Tap to Disconnect')).tap()
    await element(by.text('Disconnect')).tap()
    await element(by.id('BackChevron')).tap()
    await expect(element(by.id('ConnectedApplications/value'))).toHaveText('0')
  })
}

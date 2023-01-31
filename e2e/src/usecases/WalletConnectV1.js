import { newKit } from '@celo/contractkit'
import {
  hashMessageWithPrefix,
  verifyEIP712TypedDataSigner,
  verifySignature,
} from '@celo/utils/lib/signatureUtils'
import { recoverTransaction } from '@celo/wallet-base'
import NodeWalletConnect from '@walletconnect/node'
import { formatUri, utf8ToHex } from '../utils/encoding'
import { launchApp, reloadReactNative } from '../utils/retries'
import { enterPinUiIfNecessary, scrollIntoView, sleep, waitForElementId } from '../utils/utils'

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
    // wait for any banners to disappear
    await sleep(3 * 1000)
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

    // Verify WC page
    await waitFor(element(by.id('WalletConnectSessionRequestHeader')))
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
    await waitFor(element(by.text('WalletConnectV1 E2E would like to send a Celo transaction.')))
      .toBeVisible()
      .withTimeout(15 * 1000)

    await expect(element(by.id('DappData'))).toHaveText(`[${JSON.stringify(tx)}]`)

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

  it('Then is able to sign a transaction', async () => {
    // Save result and await for it later
    let result = walletConnector.signTransaction(tx)
    await waitFor(element(by.text('WalletConnectV1 E2E would like to sign a Celo transaction.')))
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
    await waitFor(element(by.text('WalletConnectV1 E2E would like to sign a data payload.')))
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

  it('Then is able to sign message (eth_sign)', async () => {
    const message = hashMessageWithPrefix(`My email is valora.test@mailinator.com - ${+new Date()}`)
    const msgParams = [fromAddress, message]
    let result = walletConnector.signMessage(msgParams)
    await waitFor(element(by.text('WalletConnectV1 E2E would like to sign a data payload.')))
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

  it('Then is able to sign typed data (eth_signTypedData)', async () => {
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
    await waitFor(element(by.text('WalletConnectV1 E2E would like to sign a data payload.')))
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
    const valid = verifyEIP712TypedDataSigner(typedData, signature, fromAddress)
    const invalid = verifyEIP712TypedDataSigner(typedData, signature, toAddress)
    jestExpect(valid).toStrictEqual(true)
    jestExpect(invalid).toStrictEqual(false)
  })

  it('Then is able to send custom request (eth_signTransaction)', async () => {
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
    await waitFor(element(by.text('WalletConnectV1 E2E would like to sign a Celo transaction.')))
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
    const [recoveredTx, recoveredSigner] = recoverTransaction(signature.raw)

    jestExpect(recoveredSigner.toLowerCase()).toEqual(fromAddress)
    jestExpect(recoveredTx.nonce).toEqual(parseInt(customRequest.params[0].nonce, 16))
    jestExpect(recoveredTx.to).toEqual(customRequest.params[0].to)
    jestExpect(recoveredTx.data).toEqual(customRequest.params[0].data)
    jestExpect(parseInt(recoveredTx.value, 16)).toEqual(parseInt(customRequest.params[0].value, 16))
  })

  it('Then is able to disconnect a session', async () => {
    // A sleep for ci
    await sleep(3 * 1000)

    // Wait for hamburger to be visible
    await waitForElementId('Hamburger')

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

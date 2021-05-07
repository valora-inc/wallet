import { WalletConnectWallet } from '@celo/wallet-walletconnect'

const dappName = 'Valora E2E'

export default WalletConnect = () => {
  let wallet

  beforeEach(async () => {
    wallet = new WalletConnectWallet({
      connect: {
        metadata: {
          name: dappName,
          description: 'Valora E2E test script',
          url: 'https://github.com/celo-org/wallet',
          icons: [],
        },
      },
      init: {
        logger: 'error',
      },
    })
    uri = await wallet.getUri()
    wallet.init()
  })

  it('Establishes a session', async () => {
    await element(by.id('Hamburguer')).tap()
    await element(by.id('DrawerItem/Settings')).tap()
    await element(by.id('ConnectedApplications')).tap()
    await element(by.id('ScanButton')).tap()
    await element(by.id('ManualInputButton')).tap()

    await element(by.id('ManualInput')).replaceText(uri)
    await element(by.id('ManualSubmit')).tap()

    await waitFor(element(by.id('SessionRequestHeader')))
      .toBeVisible()
      .withTimeout(30000)
  })
}

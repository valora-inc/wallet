# Connecting Dapps

Valora supports [WalletConnect v1](https://docs.walletconnect.com/1.0/) and [WalletConnect v2](https://docs.walletconnect.com/2.0/) for connecting Dapps to Valora. [WalletConnect v1 has been deprecated](https://medium.com/walletconnect/walletconnect-v1-0-sunset-notice-and-migration-schedule-8af9d3720d2e) and we recommend building new dapps using WalletConnect v2.

If you're building a Dapp we recommend [react-celo](https://github.com/celo-org/react-celo) to make it easy to connect your Dapp to Valora via WalletConnect. [cLabs](https://clabs.co/) supports react-celo and it includes a complete example to help you get started.

## WalletConnect details

Supported actions: <https://github.com/celo-org/wallet/blob/main/src/walletConnect/constants.ts#L3>

Docs for WalletConnect v2: <https://docs.walletconnect.com/2.0/javascript/sign/dapp-usage>

## Troubleshooting tips

When building the connection between your Dapp and Valora, it can be challenging to determine the source of a connection error. We recommend using the official WalletConnect example Dapp and wallet to help with this.

- If Valora cannot connect to your Dapp but is able to connect to the [WalletConnect v2 example react Dapp](https://react-app.walletconnect.com/) correctly, the issue likely lies with your Dapp. It can be helpful to check the [implementation details](https://github.com/WalletConnect/web-examples/tree/main/dapps/react-dapp-v2) of this example Dapp against your own implementation.
- If your Dapp is unable to connect to the [WalletConnect v2 example wallet](https://react-wallet.walletconnect.com/), there is likely an issue with your Dapp. As above, we recommend comparing the implementation details between your Dapp and the example Dapp provided.


WalletConnect v1 has been deprecated so we do not recommend building with this. Similar to above, this [example Dapp for WalletConnect v1](https://celo-walletconnect.vercel.app/) can be helpful to determine if a connection problem lies with Valora or your Dapp.

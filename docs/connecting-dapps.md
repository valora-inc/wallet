# Connecting Dapps

Valora supports [WalletConnect v2](https://docs.walletconnect.com/2.0/) for connecting Dapps to Valora. [WalletConnect v1 is end-of-life](https://docs.walletconnect.com/2.0/advanced/migration-from-v1.x/overview) and not supported.

If you're building a Dapp we recommend [@celo/rainbowkit-celo](https://github.com/celo-org/rainbowkit-celo) or [Web3Modal](https://github.com/WalletConnect/web3modal) to make it easy to connect your Dapp to Valora via WalletConnect. [cLabs](https://clabs.co/) supports [@celo/rainbowkit-celo](https://github.com/celo-org/rainbowkit-celo) and it includes a [complete example](https://docs.celo.org/developer/rainbowkit-celo) to help you get started.

## WalletConnect details

Supported actions: <https://github.com/celo-org/wallet/blob/main/src/walletConnect/constants.ts#L3>

Docs for WalletConnect v2: <https://docs.walletconnect.com/2.0>

## Troubleshooting tips

When building the connection between your Dapp and Valora, it can be challenging to determine the source of a connection error. We recommend using the official WalletConnect example Dapp and wallet to help with this.

- If Valora cannot connect to your Dapp but is able to connect to the [WalletConnect v2 example react Dapp](https://react-app.walletconnect.com/) correctly, the issue likely lies with your Dapp. It can be helpful to check the [implementation details](https://github.com/WalletConnect/web-examples/tree/main/dapps/react-dapp-v2) of this example Dapp against your own implementation.
- If your Dapp is unable to connect to the [WalletConnect v2 example wallet](https://react-wallet.walletconnect.com/), there is likely an issue with your Dapp. As above, we recommend comparing the implementation details between your Dapp and the example Dapp provided.

If these troubleshooting steps don't help, please join our [`#dapp-dev` channel on Discord](https://discord.gg/gQvjYv5Fqh) to discuss your specific problem.

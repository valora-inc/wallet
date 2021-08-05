# Valora Mobile App

Valora is a mobile wallet focused on making global peer-to-peer
payments simple and accessible to anyone. It supports the Celo
Identity Protocol which allows users to verify their phone number and
send payments to their contacts.

## Build Valora Locally

To setup Valora locally, follow [setup instructions](https://github.com/valora-inc/wallet/tree/main/packages/mobile).

## Repo Structure

The repository has the following packages (sub projects):

- [mobile](packages/mobile) - React Native Android and iOS app
- [blockchain-api](packages/blockchain-api) - service that uses Blockscout to present view of transactions by account for Celo Wallet activity feed
- [notification-service](packages/notification-service) - service for managing push notifications for Celo Wallet

Code owners for each package can be found in [.github/CODEOWNERS](.github/CODEOWNERS).

## Contributing

We welcome contributions in the form of Issues and PRs. See [CONTRIBUTING.md](CONTRIBUTING.md).

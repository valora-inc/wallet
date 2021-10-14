# Valora Mobile App

![example workflow](https://github.com/valora-inc/wallet/actions/workflows/check.yml/badge.svg)
![example workflow](https://github.com/valora-inc/wallet/actions/workflows/e2e.yml/badge.svg)
![example workflow](https://github.com/valora-inc/wallet/actions/workflows/test.yml/badge.svg)
[![Codecov](https://img.shields.io/codecov/c/github/valora-inc/wallet)](https://codecov.io/gh/valora-inc/wallet)
[![GitHub contributors](https://img.shields.io/github/contributors/valora-inc/wallet)](https://github.com/valora-inc/wallet/graphs/contributors)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/w/valora-inc/wallet)](https://github.com/valora-inc/wallet/graphs/contributors)
[![GitHub Stars](https://img.shields.io/github/stars/valora-inc/wallet.svg)](https://github.com/valora-inc/wallet/stargazers)
![GitHub repo size](https://img.shields.io/github/repo-size/valora-inc/wallet)
[![GitHub](https://img.shields.io/github/license/valora-inc/wallet?color=blue)](https://github.com/valora-inc/wallet/blob/master/LICENSE)

Valora is a mobile wallet focused on making global peer-to-peer
payments simple and accessible to anyone. It supports the Celo
Identity Protocol which allows users to verify their phone number and
send payments to their contacts.

## Integrate with Valora

See [deeplinks.md](./packages/mobile/docs/deeplinks.md) for integrating with Valora using deep links.

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

## Community

Have questions or need help? Join our [Discord Community](https://discord.com/invite/J5XMtMkwC4).

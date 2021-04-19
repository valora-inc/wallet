<p align="center">
  <a href="https://celo.org/">
    <img src="https://i.imgur.com/fyrJi0R.png" alt="celo logo" title="Go to celo.org" width="600" style="border:none;"/>
  </a>
</p>

**Official repository for Valora**

Valora is a mobile wallet focused on making global peer-to-peer payments simple and accessible to anyone. It supports the Celo Identity Protocol which allows users to verify their phone number and send payments to their contacts.

- [valoraapp.com](https://valoraapp.com)
- Platforms: iOS, Android
- Maintainers: [cLabs](https://clabs.co)

<!-- row 1 - status -->

[![CircleCI](https://img.shields.io/circleci/build/github/celo-org/celo-monorepo/master)](https://circleci.com/gh/celo-org/celo-monorepo/tree/master)
[![Codecov](https://img.shields.io/codecov/c/github/celo-org/celo-monorepo)](https://codecov.io/gh/celo-org/celo-monorepo)
[![GitHub contributors](https://img.shields.io/github/contributors/celo-org/celo-monorepo)](https://github.com/celo-org/celo-monorepo/graphs/contributors)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/w/celo-org/celo-monorepo)](https://github.com/celo-org/celo-monorepo/graphs/contributors)
[![GitHub Stars](https://img.shields.io/github/stars/celo-org/celo-monorepo.svg)](https://github.com/celo-org/celo-monorepo/stargazers)
![GitHub repo size](https://img.shields.io/github/repo-size/celo-org/celo-monorepo)
[![GitHub](https://img.shields.io/github/license/celo-org/celo-monorepo?color=blue)](https://github.com/celo-org/celo-monorepo/blob/master/LICENSE)

<!-- row 2 - links & profiles -->

[![Website celo.org](https://img.shields.io/website-up-down-green-red/https/celo.org.svg)](https://celo.org)
[![Blog](https://img.shields.io/badge/blog-up-green)](https://medium.com/celoorg)
[![docs](https://img.shields.io/badge/docs-up-green)](https://docs.celo.org/)
[![Youtube](https://img.shields.io/badge/YouTube%20channel-up-green)](https://www.youtube.com/channel/UCCZgos_YAJSXm5QX5D5Wkcw/videos?view=0&sort=p&flow=grid)
[![forum](https://img.shields.io/badge/forum-up-green)](https://forum.celo.org)
[![Discord](https://img.shields.io/discord/600834479145353243.svg)](https://discord.gg/RfHQKtY)
[![Twitter CeloDevs](https://img.shields.io/twitter/follow/celodevs?style=social)](https://twitter.com/celodevs)
[![Twitter CeloOrg](https://img.shields.io/twitter/follow/celoorg?style=social)](https://twitter.com/CeloOrg)
[![Subreddit subscribers](https://img.shields.io/reddit/subreddit-subscribers/CeloHQ?style=social)](https://www.reddit.com/r/CeloHQ/)

<!-- row 3 - detailed status -->

[![GitHub pull requests by-label](https://img.shields.io/github/issues-pr-raw/celo-org/celo-monorepo)](https://github.com/celo-org/celo-monorepo/pulls)
[![GitHub Issues](https://img.shields.io/github/issues-raw/celo-org/celo-monorepo.svg)](https://github.com/celo-org/celo-monorepo/issues)
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/1%20hour%20tasks)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3A%221+hour+tasks%22)
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/betanet-phase-2)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3Abetanet-phase-2)
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/betanet-phase-3)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3Abetanet-phase-3)

Contents:

<!-- TOC -->

- [Celo's Mission - Prosperity for All](#mission)
- [The Valora Stack](#stack)
- [Build Valora Locally](#build)
- [Issues](#issues)
- [Repo Structure](#repo)
- [Contributing](#contributing)
- [Ask Questions, Find Answers, Get in Touch](#ask)
- [License](#license)

  <!-- /TOC -->

## 🥅 <a id="mission"></a>Celo's Mission - Prosperity for All

Celo, pronounced /ˈtselo/, means ‘purpose’ in Esperanto. In a similar spirit, we are aiming to create a new platform to connect people globally and bring financial stability to those who need it most. We believe blockchain technology is one of the most exciting innovations in recent history and as a community we look to push the boundaries of what is possible with it today. More importantly, we are driven by purpose -- to solve real-world problems such as lack of access to sound currency, or friction for cash-transfer programs aimed to alleviate poverty. Our mission is to build a monetary system that creates the conditions for prosperity for all.

## 🧱 <a id="stack"></a>The Valora Stack

(TBW)

## 🥅 <a id="build"></a>Build Valora Locally

To setup Valora locally, follow setup instructions here: https://github.com/celo-org/wallet/tree/main/packages/mobile.

## 🙋 <a id="issues"></a>Issues

See the [issue backlog](https://github.com/celo-org/celo-monorepo/issues) for a list of active or proposed tasks. Feel free to create new issues to report bugs and/or request features.

## 📂 <a id="repo"></a>Repo Structure

The repository has the following packages (sub projects):

- [mobile](packages/mobile) - Android wallet app for the Celo platform ([docs](https://docs.celo.org/getting-started/using-the-mobile-wallet), [live](https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores))
- [blockchain-api](packages/blockchain-api) - service that uses Blockscout to present view of transactions by account for Celo Wallet activity feed
- [notification-service](packages/notification-service) - service for managing push notifications for Celo Wallet

Code owners for each package can be found in [.github/CODEOWNERS](.github/CODEOWNERS).

## ✍️ <a id="contributing"></a>Contributing

Feel free to jump on the Celo 🚂🚋🚋🚋. Improvements and contributions are highly encouraged! 🙏👊

See the [contributing guide](https://docs.celo.org/community/contributing) for details on how to participate.
[![GitHub issues by-label](https://img.shields.io/github/issues/celo-org/celo-monorepo/1%20hour%20tasks)](https://github.com/celo-org/celo-monorepo/issues?q=is%3Aopen+is%3Aissue+label%3A%221+hour+tasks%22)

All communication and contributions to the Celo project are subject to the [Celo Code of Conduct](https://celo.org/code-of-conduct).

Not yet ready to contribute but do like the project? Support Celo with a ⭐ or share the love in a [![Twitter URL](https://img.shields.io/twitter/url?style=social&url=https%3A%2F%2Fcelo.org%2F)](https://twitter.com/intent/tweet?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DkKggE5OvyhE&via=celohq&text=Checkout%20celo%21%20Love%20what%20they%20are%20building.&hashtags=celo)

<!--
Twitter
twitter intent generator - http://tech.cymi.org/tweet-intents
-->

## 💬 <a id="ask"></a>Ask Questions, Find Answers, Get in Touch

- [Website](https://celo.org/)
- [Docs](https://docs.celo.org/)
- [Blog](https://medium.com/celohq)
- [YouTube](https://www.youtube.com/channel/UCCZgos_YAJSXm5QX5D5Wkcw/videos?view=0&sort=p&flow=grid)
- [Forum](https://forum.celo.org)
- [Discord](https://discord.gg/vRbExjv)
- [Twitter](https://twitter.com/CeloDevs)
- [Reddit](https://www.reddit.com/r/CeloHQ/)
- [Community Events](https://celo.org/community)

## 📜 <a id="license"></a>License

All packages are licensed under the terms of the [Apache 2.0 License](LICENSE) unless otherwise specified in the LICENSE file at package's root.

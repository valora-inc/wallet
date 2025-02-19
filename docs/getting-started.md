# Getting Started with Divvi Mobile

Creating a mobile app with Divvi Mobile is incredibly quick and straightforward. In just a few steps, you'll have your own mobile app ready for development!

## Basic Prerequisites

You'll need:

- [Node.js (LTS)](https://nodejs.org/en/)
- macOS or Linux operating system
- [Yarn](https://yarnpkg.com/getting-started/install) package manager

## Creating Your First App

1. Create a new app using our template:

```bash
yarn create expo --template https://github.com/divvi-xyz/beefy my-app
cd my-app
```

2. Install dependencies:

```bash
yarn install
```

## Setting Up Your Development Environment

Before running your app, you'll need to set up your development environment. While we use Expo's build tools, Divvi Mobile requires a native development environment (it cannot run in Expo Go).

Follow Expo's interactive setup guide:

[Set up your development environment →](https://docs.expo.dev/get-started/set-up-your-environment/?mode=development-build)

The guide will walk you through setting up:

- iOS development environment (macOS only)
  - Xcode and iOS Simulator
- Android development environment
  - Android Studio, SDK, and Emulator
- Required tools and dependencies

Make sure to select "Development build" mode in the guide, as this is required for Divvi Mobile apps.

## Running Your App

Once your environment is set up, you can run your app:

For iOS (macOS only):

```bash
yarn ios
```

For Android:

```bash
yarn android
```

This will build your app and launch it in your simulator/emulator. The development server will start automatically.

## What's Next?

- Learn how to [configure your app](configuration.md)
- Explore the [architecture](architecture.md)
- Browse the [API reference](api-reference.md)

## Need Help?

If you run into any issues or have questions:

- Open an issue on our GitHub repository
- Join our community Discord server
- Check our troubleshooting guide

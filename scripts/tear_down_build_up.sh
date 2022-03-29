#!/usr/bin/env bash

echo "Tearing Down ..."

echo "Removing zed-io/wallet/node_modules ..."
# If node_modules exists, delete it.
if [ -d "node_modules" ]; then
  rm -rf node_modules
fi

echo "Removing ./packages/mobile/node_modules ..."
# If packages/mobile/node_modules exists, delete it.
if [ -d "packages/mobile/node_modules" ]; then
  rm -rf packages/mobile/node_modules
fi

echo "Removing .mobile/ios/Pods ..."
# If Pods are installed in packages/mobile/ios, deintegrate them
if [ -d "packages/mobile/ios/Pods" ]; then
  cd packages/mobile/ios
  pod deintegrate
  cd ../../..
fi

echo "Building Up..."

echo "Installing zed-io/wallet/node_modules ..."
# Install dependencies in cwd using Yarn
arch -x86_64 yarn install

echo "Building zed-io/wallet ..."
# Build dependencies for cwd (wallet) using Yarn
arch -x86_64 yarn build:wallet

echo "Installing ./packages/mobile/node_modules..."
# Install dependencies in packages/mobile using Yarn
arch -x86_64 yarn install --cwd packages/mobile

echo "Installing ./mobile/ios/Pods ..."
# Install pods using x86_64 architecture for Mac M1

if [ -d "packages/mobile/ios/Pods" ]; then
  cd packages/mobile/ios
  arch -x86_64 bundle exec pod install
  cd ../../..
fi

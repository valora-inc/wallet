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

echo "Installing wallet/node_modules ..."
# Install dependencies in cwd using Yarn
arch -x86_64 yarn --silent install

echo "Building wallet from monorepo and hoisting RN packages..."
# Build dependencies for cwd (wallet) using Yarn
arch -x86_64 yarn --silent build

echo "Installing gems (e.g. cocoapods) ..."
if [ -d "packages/mobile" ]; then
  cd packages/mobile/ios
  arch -x86_64 bundle install
  cd ../../..
fi

echo "Installing Pods in /mobile/ios/ ..."
# Install pods using x86_64 architecture for Mac M1
if [ -d "packages/mobile/ios" ]; then
  cd packages/mobile/ios
  arch -x86_64 bundle exec pod install
  cd ../../..
fi

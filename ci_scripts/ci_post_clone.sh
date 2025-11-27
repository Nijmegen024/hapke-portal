#!/bin/sh
set -euo pipefail

# Ensure Flutter packages and pods are in sync after clone
export PUB_CACHE="$HOME/.pub-cache"
flutter pub get
cd ios
rm -rf Pods Podfile.lock
pod install

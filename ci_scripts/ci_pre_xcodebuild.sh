#!/bin/sh
set -euo pipefail

# Ensure dependencies are in sync before Xcode build (Xcode Cloud)
export PUB_CACHE="$HOME/.pub-cache"
flutter pub get
cd ios
rm -rf Pods Podfile.lock
pod install

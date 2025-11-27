#!/bin/sh
set -euo pipefail

cd ios
rm -rf Pods Podfile.lock
pod install

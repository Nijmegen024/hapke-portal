#!/bin/sh
set -euo pipefail

# Ensure Flutter packages and pods are in sync after clone
export PUB_CACHE="$HOME/.pub-cache"
flutter pub get
mkdir -p "$PUB_CACHE/hosted/pub.dev/flutter_secure_storage-9.2.4/ios/Classes"
cat > "$PUB_CACHE/hosted/pub.dev/flutter_secure_storage-9.2.4/ios/Classes/FlutterSecureStoragePlugin.h" <<'EOF'
#import <flutter_secure_storage/flutter_secure_storage-Swift.h>
EOF
cd ios
rm -rf Pods Podfile.lock
pod install

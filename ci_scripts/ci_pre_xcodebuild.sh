#!/bin/sh
set -euo pipefail

# Ensure dependencies are in sync before Xcode build (Xcode Cloud)
export PUB_CACHE="${PUB_CACHE:-$HOME/.pub-cache}"
flutter pub get
# Ensure header exists both in PUB_CACHE and root /.pub-cache (Xcode Cloud sometimes uses root)
for cache in "$PUB_CACHE" "/.pub-cache"; do
  mkdir -p "$cache/hosted/pub.dev/flutter_secure_storage-9.2.4/ios/Classes"
  cat > "$cache/hosted/pub.dev/flutter_secure_storage-9.2.4/ios/Classes/FlutterSecureStoragePlugin.h" <<'EOF'
#import <flutter_secure_storage/flutter_secure_storage-Swift.h>
EOF
done
cd ios
rm -rf Pods Podfile.lock
pod install

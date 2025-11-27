#!/bin/sh
set -euo pipefail

# Ensure Flutter packages and pods are in sync after clone
export PUB_CACHE="$PWD/.pub-cache"
flutter pub get
# Ensure required files exist in the local pub cache
mkdir -p "$PUB_CACHE/hosted/pub.dev/flutter_secure_storage-9.2.4/ios/Classes"
cat > "$PUB_CACHE/hosted/pub.dev/flutter_secure_storage-9.2.4/ios/Classes/FlutterSecureStoragePlugin.h" <<'EOF'
#import <flutter_secure_storage/flutter_secure_storage-Swift.h>
EOF
mkdir -p "$PUB_CACHE/hosted/pub.dev/url_launcher_ios-6.3.4/ios/url_launcher_ios/Sources/url_launcher_ios/Resources"
cat > "$PUB_CACHE/hosted/pub.dev/url_launcher_ios-6.3.4/ios/url_launcher_ios/Sources/url_launcher_ios/Resources/PrivacyInfo.xcprivacy" <<'EOF'
{}
EOF
cd ios
rm -rf Pods Podfile.lock
pod install

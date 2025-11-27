#!/bin/sh
set -euo pipefail

# Ensure dependencies are in sync before Xcode build (Xcode Cloud)
export PUB_CACHE="$PWD/.pub-cache"
mkdir -p "$PUB_CACHE"
# Try to point /.pub-cache to our writable cache (ignore failures)
rm -rf "/.pub-cache" 2>/dev/null || true
ln -s "$PUB_CACHE" "/.pub-cache" 2>/dev/null || true

# Regenerate plugins file with local cache
rm -f .flutter-plugins .flutter-plugins-dependencies
flutter pub get
# Rewrite plugin paths if they still point to /.pub-cache
if [ -f .flutter-plugins-dependencies ]; then
  sed -i '' "s#/\.pub-cache#$PUB_CACHE#g" .flutter-plugins-dependencies || true
fi
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

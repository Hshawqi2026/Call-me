#!/usr/bin/env bash
set -euo pipefail

SDK_ROOT="${ANDROID_SDK_ROOT:-$HOME/android-sdk}"
TOOLS_DIR="$SDK_ROOT/cmdline-tools/latest"
ZIP_PATH="${TMPDIR:-/tmp}/commandlinetools-linux.zip"

mkdir -p "$SDK_ROOT/cmdline-tools"
if [ ! -x "$TOOLS_DIR/bin/sdkmanager" ]; then
  curl -fL --retry 3 "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "$ZIP_PATH"
  rm -rf "$SDK_ROOT/cmdline-tools/latest" "$SDK_ROOT/cmdline-tools/tmp"
  mkdir -p "$SDK_ROOT/cmdline-tools/tmp"
  unzip -q -o "$ZIP_PATH" -d "$SDK_ROOT/cmdline-tools/tmp"
  mv "$SDK_ROOT/cmdline-tools/tmp/cmdline-tools" "$TOOLS_DIR"
  rm -rf "$SDK_ROOT/cmdline-tools/tmp"
fi

export ANDROID_HOME="$SDK_ROOT"
export ANDROID_SDK_ROOT="$SDK_ROOT"
export PATH="$TOOLS_DIR/bin:$SDK_ROOT/platform-tools:$PATH"

yes | sdkmanager --licenses >/dev/null || true
sdkmanager --sdk_root="$SDK_ROOT" \
  "platform-tools" \
  "platforms;android-36" \
  "build-tools;36.0.0" \
  "ndk;27.1.12297006"

printf 'export ANDROID_HOME=%q\n' "$SDK_ROOT"
printf 'export ANDROID_SDK_ROOT=%q\n' "$SDK_ROOT"
printf 'export PATH=%q:\$PATH\n' "$TOOLS_DIR/bin:$SDK_ROOT/platform-tools"

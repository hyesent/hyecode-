# Hyecode Android setup notes

## Shared project-file access

Hyecode's current workspace loader uses Capacitor Filesystem against shared external storage so it can open, edit, create, rename, and delete project files.

- Android 11 and newer require the special **All files access** permission for this path-based workflow. On first launch, Hyecode explains why the permission is needed and offers to open Android's app-specific settings page.
- Older Android versions use the applicable legacy read/write storage permissions.
- If access is skipped, open **Settings → Apps → Hyecode → Special app access → All files access** and enable it where available.
- `MANAGE_EXTERNAL_STORAGE` is a restricted permission under Google Play policy. If distributing through Google Play, declare it only if the app's core file-management use case qualifies and complete the applicable review. Direct APK distribution does not remove Android's runtime permission requirement.

The app also declares internet and network-state access for repository/provider connectivity and future optional model downloads. No notification, location, microphone, camera, or contacts permissions have been added because the current editor does not require them.

## Branding

- App display name: **Hyecode**
- Splash title: **Hye code**
- Tagline: **Seamless mobile coding**
- Android launcher assets are regenerated from `public/icon-512.png`.
- The native splash artwork is sized for portrait and landscape density buckets. A matching short React splash keeps the title and tagline visible while the web UI initializes.

## Build

Build the web assets with `npm ci` and `npm run build`, then sync/build the Android project using the project's existing Capacitor/Gradle workflow. A full Android APK build requires a configured Android SDK.

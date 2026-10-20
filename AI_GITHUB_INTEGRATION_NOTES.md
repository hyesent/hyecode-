# Hyecode AI and GitHub integration notes

## Implemented in this build
- Replaced the old HYE AI backend request with an optional user-configured OpenAI-compatible cloud endpoint. No request is sent to the old Hyesent AI endpoint.
- Cloud API key is held in React state only and is not persisted. Provider URL/model preferences are stored locally.
- Added GitHub connection using a user-provided GitHub personal access token, held in memory only.
- Added repository listing and archive-based repository download into the configured Android shared-storage path, then loads that path into the workspace.
- Archive download is not a full Git clone: no `.git` directory, history, branches, push, or pull.
- Added Local AI and Cloud AI panels plus Local/Cloud settings navigation.
- Added native Android DownloadManager model downloads, progress/cancel/retry UI, GGUF header validation, optional SHA-256 verification, model load/unload/delete, and local prompt generation through the llama.cpp-based Android runtime. See `LOCAL_AI_SETUP.md`.

## Important limitations
- Local AI now has a native runtime integration, but it has not been validated with a completed Gradle/APK build in this environment. Build and test on a 64-bit ARM Android device before release. The selected AAR publishes arm64-v8a native binaries. Model compatibility and available RAM still determine whether a particular GGUF loads.
- GitHub uses a PAT entry rather than OAuth/device flow because this repo has no registered GitHub OAuth App client ID. For a public production release, implement a proper OAuth/device flow with a registered app and a safer token lifecycle.
- GitHub archive extraction needs `jszip` installed via npm. Run `npm install` before the build.
- OpenAI-compatible provider calls may fail when a provider blocks CORS in Android WebView; a provider-supported client flow or secure relay may be needed for those providers. Hyecode does not proxy or pay for the requests.
- Do not store user API keys in localStorage. This build only keeps the cloud key in memory for the active app session.

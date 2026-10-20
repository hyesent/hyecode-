# Hyecode Local AI — Android setup

## What is implemented

- Native Android download through `DownloadManager`, with Android-managed retries across network interruptions and device restarts.
- Model files are kept separately from the APK in Hyecode's app-specific external-files directory (`Documents/hyecode-models`). Uninstalling Hyecode removes this app-specific data.
- Download progress, cancel, retry, GGUF magic-header validation, optional SHA-256 verification, model load/unload, offline prompt generation, and model deletion.
- Native inference is provided by `dev.ffmpegkit-maintained:llama-android:0.1.1` (llama.cpp-based GGUF runtime).
- No additional npm package is required for local model download or inference. The Android build adds Kotlin, the llama Android AAR, and coroutines dependencies.

## Configure your Hugging Face model

1. Upload/select a **GGUF quantized model** compatible with llama.cpp. Prefer a small instruct/coding model and check its license and redistribution terms.
2. In Hyecode, open **AI → Local AI → Settings → Local**.
3. Paste the **direct HTTPS file URL**, not the Hugging Face repository page. A typical URL uses `/resolve/main/<filename>.gguf`. The host must allow unauthenticated direct downloads; Android DownloadManager does not use a Hugging Face login cookie.
4. Set a local filename ending in `.gguf`.
5. Optionally enter the model's expected 64-character SHA-256 digest. If provided, a mismatch causes the downloaded file to be deleted.
6. Tap **Download model**, wait for GGUF validation, then **Load model**. Ask questions in the Local AI tab. Generation runs on-device; it does not call Hyecode's backend or a cloud AI provider.

## Native build

From the project root:

```sh
npm install
npx cap sync android
cd android
./gradlew :app:assembleDebug
```

Use a current Android SDK/NDK/Gradle environment. The configured llama Android AAR currently publishes `arm64-v8a` native binaries, so local inference is intended for 64-bit ARM Android devices. The APK can still be built for other architectures, but the native runtime will not be available there unless an appropriate library build is added.

## Runtime and storage notes

- The model is not bundled in the APK. Download size depends on the exact GGUF quantization; check free storage before downloading.
- Model loading allocates native memory. Android can reject or kill inference if the phone does not have enough free RAM. The bridge starts with a 2,048-token context and at most four CPU threads to limit memory and CPU pressure.
- Android DownloadManager can retry/resume supported downloads, but the server must support a compatible download response. If it fails, cancel and retry; Hyecode does not claim byte-for-byte resume for every host.
- The current free runtime returns a complete response rather than streaming tokens. Large prompts can take time on low-end phones.
- The expected SHA-256 field is optional; GGUF header validation alone checks file type, not authenticity. Use a digest from a trusted source when possible.

## Build verification status

The React/JSX source was syntax-parsed after these changes. A full Vite/Gradle build could not be run in this environment because dependencies and the Gradle distribution were not reachable from the network. Run the native build above before releasing an APK; resolve any dependency repository or SDK errors reported by Gradle.

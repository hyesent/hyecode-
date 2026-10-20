package com.hye.editor

import android.app.DownloadManager
import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.os.Environment
import android.os.Build
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import dev.ffmpegkit.llama.Llama
import dev.ffmpegkit.llama.LlamaConfig
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileInputStream
import java.security.MessageDigest

@CapacitorPlugin(name = "LocalLlama")
class LocalLlamaPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var generateAction: (suspend (String) -> String)? = null
    private var releaseAction: (suspend () -> Unit)? = null
    private var loadedFileName: String? = null

    private fun modelDirectory(): File {
        val dir = File(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS), "hyecode-models")
        if (!dir.exists() && !dir.mkdirs()) throw IllegalStateException("Could not create the local model folder")
        return dir
    }


    private val localAiLibraryNames = listOf(
        "libc++_shared.so",
        "libggml-base.so",
        "libggml-cpu.so",
        "libggml.so",
        "libllama.so",
        "libllama_jni.so"
    )
    @Volatile private var localAiLibrariesLoaded = false

    private fun localAiSupported(): Boolean =
        Build.SUPPORTED_ABIS.any { it == "arm64-v8a" }

    private fun ensureLocalAiAvailable() {
        if (!localAiSupported()) {
            throw IllegalStateException(
                "Local AI is not supported on this phone because it requires a 64-bit ARM processor. " +
                "Hyecode's editor and cloud AI can still be used normally."
            )
        }
        if (localAiLibrariesLoaded) return
        synchronized(this) {
            if (localAiLibrariesLoaded) return
            val libDir = File(context.filesDir, "hyecode-local-ai-libs/arm64-v8a")
            if (!libDir.exists() && !libDir.mkdirs()) {
                throw IllegalStateException("Could not prepare the optional Local AI engine.")
            }
            for (name in localAiLibraryNames) {
                val target = File(libDir, name)
                if (!target.isFile || target.length() == 0L) {
                    context.assets.open("local-ai-libs/arm64-v8a/$name").use { input ->
                        target.outputStream().use { output -> input.copyTo(output) }
                    }
                }
            }
            // Load dependencies before the JNI entry point.
            localAiLibraryNames.forEach { name -> System.load(File(libDir, name).absolutePath) }
            localAiLibrariesLoaded = true
        }
    }

    @PluginMethod
    fun getAvailability(call: PluginCall) {
        val supported = localAiSupported()
        call.resolve(
            JSObject()
                .put("supported", supported)
                .put("abi", Build.SUPPORTED_ABIS.firstOrNull() ?: "unknown")
                .put(
                    "message",
                    if (supported) "Local AI is supported on this device."
                    else "Local AI needs a 64-bit ARM phone. Your editor and cloud AI remain available."
                )
        )
    }

    @PluginMethod
    fun startDownload(call: PluginCall) {
        if (!localAiSupported()) { call.reject("Local AI needs a 64-bit ARM phone. Your editor and cloud AI remain available."); return }
        try {
            val url = call.getString("url")?.trim().orEmpty()
            val fileName = safeFileName(call.getString("fileName"))
            val parsed = Uri.parse(url)
            if (parsed.scheme != "https" || parsed.host.isNullOrBlank()) {
                call.reject("Use a direct HTTPS URL to the .gguf model file")
                return
            }
            if (!fileName.endsWith(".gguf", ignoreCase = true)) {
                call.reject("Model file name must end in .gguf")
                return
            }
            val target = File(modelDirectory(), fileName)
            if (target.exists()) target.delete()
            val request = DownloadManager.Request(parsed)
                .setTitle("Hyecode local AI model")
                .setDescription("Downloading $fileName")
                .setMimeType("application/octet-stream")
                .setAllowedOverMetered(true)
                .setAllowedOverRoaming(false)
                .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE)
                .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOCUMENTS, "hyecode-models/$fileName")
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            val id = manager.enqueue(request)
            call.resolve(JSObject().put("downloadId", id.toString()).put("fileName", fileName).put("path", target.absolutePath))
        } catch (error: Exception) {
            call.reject(error.message ?: "Could not start model download", error)
        }
    }

    @PluginMethod
    fun getDownloadStatus(call: PluginCall) {
        val id = call.getString("downloadId")?.toLongOrNull()
        if (id == null) { call.reject("Missing or invalid download ID"); return }
        var cursor: Cursor? = null
        try {
            val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
            cursor = manager.query(DownloadManager.Query().setFilterById(id))
            if (cursor == null || !cursor.moveToFirst()) {
                call.resolve(JSObject().put("status", "missing").put("message", "Download no longer exists"))
                return
            }
            val status = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_STATUS))
            val reason = cursor.getInt(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_REASON))
            val downloaded = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)).coerceAtLeast(0)
            val total = cursor.getLong(cursor.getColumnIndexOrThrow(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)).coerceAtLeast(0)
            val label = when (status) {
                DownloadManager.STATUS_PENDING -> "pending"
                DownloadManager.STATUS_RUNNING -> "downloading"
                DownloadManager.STATUS_PAUSED -> "paused"
                DownloadManager.STATUS_SUCCESSFUL -> "completed"
                DownloadManager.STATUS_FAILED -> "failed"
                else -> "unknown"
            }
            call.resolve(JSObject().put("status", label).put("bytesDownloaded", downloaded).put("totalBytes", total).put("reason", reason).put("message", if (status == DownloadManager.STATUS_FAILED) downloadError(reason) else ""))
        } catch (error: Exception) {
            call.reject(error.message ?: "Could not read download status", error)
        } finally { cursor?.close() }
    }

    @PluginMethod
    fun cancelDownload(call: PluginCall) {
        val id = call.getString("downloadId")?.toLongOrNull()
        if (id == null) { call.reject("Missing or invalid download ID"); return }
        val manager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        manager.remove(id)
        call.resolve(JSObject().put("cancelled", true))
    }

    @PluginMethod
    fun validateModel(call: PluginCall) {
        scope.launch {
            try {
                val fileName = safeFileName(call.getString("fileName"))
                val expectedHash = call.getString("sha256")?.trim()?.lowercase().orEmpty()
                val file = File(modelDirectory(), fileName)
                val result = withContext(Dispatchers.IO) {
                    if (!file.isFile || file.length() < 1024 * 1024) throw IllegalStateException("Downloaded model is missing or too small")
                    FileInputStream(file).use { input ->
                        val magic = ByteArray(4)
                        if (input.read(magic) != 4 || String(magic, Charsets.US_ASCII) != "GGUF") {
                            file.delete()
                            throw IllegalStateException("The downloaded file is not a valid GGUF model. The invalid file was deleted. Check the direct Hugging Face file URL.")
                        }
                    }
                    val digest = MessageDigest.getInstance("SHA-256")
                    FileInputStream(file).use { input ->
                        val buffer = ByteArray(1024 * 1024)
                        while (true) {
                            val count = input.read(buffer)
                            if (count < 0) break
                            digest.update(buffer, 0, count)
                        }
                    }
                    digest.digest().joinToString("") { "%02x".format(it.toInt() and 0xff) }
                }
                if (expectedHash.isNotEmpty() && !result.equals(expectedHash, true)) {
                    file.delete()
                    throw IllegalStateException("SHA-256 verification failed. The incomplete or incorrect file was deleted.")
                }
                call.resolve(JSObject().put("valid", true).put("fileName", fileName).put("path", file.absolutePath).put("sizeBytes", file.length()).put("sha256", result))
            } catch (error: Exception) { call.reject(error.message ?: "Model validation failed", error) }
        }
    }

    @PluginMethod
    fun loadModel(call: PluginCall) {
        scope.launch {
            try {
                ensureLocalAiAvailable()
                val fileName = safeFileName(call.getString("fileName"))
                val file = File(modelDirectory(), fileName)
                if (!file.isFile || file.length() < 1024 * 1024) throw IllegalStateException("Model file is not installed or is incomplete")
                releaseAction?.invoke()
                generateAction = null
                releaseAction = null
                val loaded = withContext(Dispatchers.IO) {
                    Llama.loadModel(
                        modelPath = file.absolutePath,
                        config = LlamaConfig(contextSize = 2048, threads = Runtime.getRuntime().availableProcessors().coerceIn(2, 4))
                    )
                }
                generateAction = { prompt ->
                    Llama.complete(
                        loaded,
                        prompt = prompt,
                        systemPrompt = "You are Hyecode's private on-device programming assistant. Give accurate, practical coding help. Keep answers concise unless detail is requested. Never claim you ran code unless it was actually executed.",
                        maxTokens = 256
                    ).text
                }
                releaseAction = { Llama.releaseModel(loaded) }
                loadedFileName = fileName
                call.resolve(JSObject().put("loaded", true).put("fileName", fileName).put("message", "Model loaded into device memory"))
            } catch (error: Exception) {
                generateAction = null
                releaseAction = null
                loadedFileName = null
                call.reject(error.message ?: "Could not load local model. The phone may not have enough available memory.", error)
            }
        }
    }

    @PluginMethod
    fun generate(call: PluginCall) {
        if (!localAiSupported()) { call.reject("Local AI needs a 64-bit ARM phone. Your editor and cloud AI remain available."); return }
        val prompt = call.getString("prompt")?.trim().orEmpty()
        if (prompt.isEmpty()) { call.reject("Enter a prompt"); return }
        val action = generateAction
        if (action == null) { call.reject("Load an installed local model first"); return }
        scope.launch {
            try {
                val answer = withContext(Dispatchers.IO) { action(prompt) }
                call.resolve(JSObject().put("text", answer).put("fileName", loadedFileName ?: ""))
            } catch (error: Exception) { call.reject(error.message ?: "Local model generation failed", error) }
        }
    }

    @PluginMethod
    fun unloadModel(call: PluginCall) {
        scope.launch {
            try {
                releaseAction?.invoke()
                releaseAction = null
                generateAction = null
                loadedFileName = null
                call.resolve(JSObject().put("unloaded", true))
            } catch (error: Exception) { call.reject(error.message ?: "Could not unload model", error) }
        }
    }

    @PluginMethod
    fun deleteModel(call: PluginCall) {
        scope.launch {
            try {
                val fileName = safeFileName(call.getString("fileName"))
                if (loadedFileName == fileName) {
                    releaseAction?.invoke()
                    releaseAction = null
                    generateAction = null
                    loadedFileName = null
                }
                val file = File(modelDirectory(), fileName)
                val deleted = !file.exists() || file.delete()
                if (!deleted) throw IllegalStateException("Could not delete model file")
                call.resolve(JSObject().put("deleted", true))
            } catch (error: Exception) { call.reject(error.message ?: "Could not delete model", error) }
        }
    }

    private fun safeFileName(value: String?): String {
        val name = value?.trim().orEmpty()
        if (name.isEmpty() || name.contains("..") || !name.matches(Regex("[A-Za-z0-9._-]+"))) {
            throw IllegalArgumentException("Model filename may contain only letters, numbers, dots, underscores and hyphens")
        }
        return name
    }

    private fun downloadError(reason: Int): String = when (reason) {
        DownloadManager.ERROR_INSUFFICIENT_SPACE -> "Not enough free storage space"
        DownloadManager.ERROR_DEVICE_NOT_FOUND -> "Model storage location is unavailable"
        DownloadManager.ERROR_CANNOT_RESUME -> "Android could not resume the download. Cancel and retry."
        DownloadManager.ERROR_HTTP_DATA_ERROR -> "Network transfer failed"
        DownloadManager.ERROR_UNHANDLED_HTTP_CODE -> "The model URL returned an HTTP error. Use a direct public GGUF download URL."
        else -> "Android download failed (code $reason)"
    }
}

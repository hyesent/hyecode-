package com.hye.editor

import android.content.Intent
import android.net.Uri
import android.provider.DocumentsContract
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

@CapacitorPlugin(name = "ProjectFolder")
class ProjectFolderPlugin : Plugin() {
    @PluginMethod
    fun pickFolder(call: PluginCall) {
        val intent = Intent(Intent.ACTION_OPEN_DOCUMENT_TREE).apply {
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION)
            addFlags(Intent.FLAG_GRANT_PREFIX_URI_PERMISSION)
        }
        startActivityForResult(call, intent, "folderPicked")
    }

    @com.getcapacitor.annotation.ActivityCallback
    private fun folderPicked(call: PluginCall, result: androidx.activity.result.ActivityResult) {
        if (result.resultCode != android.app.Activity.RESULT_OK) {
            call.reject("Folder selection cancelled")
            return
        }
        val uri: Uri = result.data?.data ?: run {
            call.reject("No folder was selected")
            return
        }
        try {
            context.contentResolver.takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            )
        } catch (_: SecurityException) { }

        // Capacitor Filesystem's existing workspace operations use shared-storage paths.
        // Resolve Android's primary shared-storage tree into that path form.
        val documentId = try { DocumentsContract.getTreeDocumentId(uri) } catch (_: Exception) { "" }
        if (documentId.startsWith("primary:")) {
            val relative = documentId.removePrefix("primary:").trim('/')
            val path = if (relative.isBlank()) "/storage/emulated/0" else "/storage/emulated/0/$relative"
            call.resolve(JSObject().put("path", path).put("uri", uri.toString()))
        } else {
            call.reject("Please choose a folder in shared device storage, such as Internal storage or a folder inside it.")
        }
    }
}

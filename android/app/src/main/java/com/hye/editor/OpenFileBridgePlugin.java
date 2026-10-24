package com.hye.editor;

import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

@CapacitorPlugin(name = "OpenFileBridge")
public class OpenFileBridgePlugin extends Plugin {
    private static final int MAX_TEXT_FILE_BYTES = 10 * 1024 * 1024;

    @PluginMethod
    public void consumePendingFile(PluginCall call) {
        Intent intent = getActivity().getIntent();
        if (intent == null || intent.getData() == null || !isOpenAction(intent.getAction())) {
            JSObject empty = new JSObject();
            empty.put("available", false);
            call.resolve(empty);
            return;
        }
        Uri uri = intent.getData();
        try {
            getContext().getContentResolver().takePersistableUriPermission(
                uri, intent.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
            );
        } catch (Exception ignored) { /* Many providers grant temporary rather than persistable access. */ }

        try {
            String name = displayName(uri);
            byte[] bytes;
            try (InputStream input = getContext().getContentResolver().openInputStream(uri);
                 ByteArrayOutputStream output = new ByteArrayOutputStream()) {
                if (input == null) throw new IllegalStateException("Android could not open this file.");
                byte[] buffer = new byte[8192];
                int count;
                while ((count = input.read(buffer)) != -1) {
                    if (output.size() + count > MAX_TEXT_FILE_BYTES) {
                        throw new IllegalArgumentException("This file is larger than 10 MB. Open it from a project folder instead.");
                    }
                    output.write(buffer, 0, count);
                }
                bytes = output.toByteArray();
            }
            String content = new String(bytes, StandardCharsets.UTF_8);
            if (content.indexOf('\u0000') >= 0) throw new IllegalArgumentException("This looks like a binary file, not a text/code file.");
            JSObject result = new JSObject();
            result.put("available", true);
            result.put("name", name);
            result.put("content", content);
            result.put("uri", uri.toString());
            result.put("mimeType", getContext().getContentResolver().getType(uri));
            call.resolve(result);
            // Clear the data intent so a resume/poll does not reopen the same document.
            getActivity().setIntent(new Intent(getActivity(), MainActivity.class));
        } catch (Exception error) {
            // Do not retry an unsupported document on every foreground poll.
            getActivity().setIntent(new Intent(getActivity(), MainActivity.class));
            call.reject(error.getMessage() == null ? "Could not open this file in Hyecode." : error.getMessage(), error);
        }
    }

    @PluginMethod
    public void saveFile(PluginCall call) {
        String rawUri = call.getString("uri");
        String content = call.getString("content");
        if (rawUri == null || content == null) {
            call.reject("A file URI and file contents are required.");
            return;
        }
        try {
            Uri uri = Uri.parse(rawUri);
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new IllegalStateException("Android could not write to this file location.");
                output.write(content.getBytes(StandardCharsets.UTF_8));
                output.flush();
            }
            JSObject result = new JSObject();
            result.put("saved", true);
            call.resolve(result);
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "Could not save this file. Reopen it from the file manager and try again." : error.getMessage(), error);
        }
    }

    private boolean isOpenAction(String action) {
        return Intent.ACTION_VIEW.equals(action) || Intent.ACTION_EDIT.equals(action) || Intent.ACTION_SEND.equals(action);
    }

    private String displayName(Uri uri) {
        String name = null;
        try (Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null)) {
            if (cursor != null && cursor.moveToFirst()) {
                int index = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                if (index >= 0) name = cursor.getString(index);
            }
        } catch (Exception ignored) { }
        if (name == null || name.trim().isEmpty()) name = uri.getLastPathSegment();
        return name == null || name.trim().isEmpty() ? "opened-file.txt" : name;
    }
}

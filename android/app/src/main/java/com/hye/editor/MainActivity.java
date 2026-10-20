package com.hye.editor;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;

import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {
    private static final int LEGACY_STORAGE_REQUEST = 4817;
    private static final String STORAGE_PREFS = "hyecode_storage_access";
    private static final String PROMPT_SHOWN = "all_files_access_prompted";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LocalLlamaPlugin.class);
        registerPlugin(ProjectFolderPlugin.class);
        super.onCreate(savedInstanceState);

        // Let the Capacitor WebView start before showing Android's permission rationale.
        new Handler(Looper.getMainLooper()).postDelayed(this::ensureStorageAccess, 900);
    }

    private void ensureStorageAccess() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            if (Environment.isExternalStorageManager()) {
                return;
            }

            SharedPreferences preferences = getSharedPreferences(STORAGE_PREFS, MODE_PRIVATE);
            if (preferences.getBoolean(PROMPT_SHOWN, false) || isFinishing()) {
                return;
            }
            preferences.edit().putBoolean(PROMPT_SHOWN, true).apply();

            new AlertDialog.Builder(this)
                .setTitle("Allow project file access")
                .setMessage(
                    "Hyecode needs file-management access to open and edit project folders " +
                    "outside its private app storage. Android will ask you to enable " +
                    "‘Allow access to manage all files’ for Hyecode. Your files remain on your device."
                )
                .setNegativeButton("Not now", (dialog, which) -> dialog.dismiss())
                .setPositiveButton("Open settings", (dialog, which) -> openAllFilesSettings())
                .setCancelable(true)
                .show();
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> missing = new ArrayList<>();
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE)
                    != PackageManager.PERMISSION_GRANTED) {
                missing.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE)
                    != PackageManager.PERMISSION_GRANTED) {
                missing.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
            if (!missing.isEmpty()) {
                requestPermissions(missing.toArray(new String[0]), LEGACY_STORAGE_REQUEST);
            }
        }
    }

    private void openAllFilesSettings() {
        try {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION,
                Uri.parse("package:" + getPackageName())
            );
            startActivity(intent);
        } catch (Exception ignored) {
            try {
                startActivity(new Intent(Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION));
            } catch (Exception fallbackIgnored) {
                // The user can still enable access from Android Settings > Apps > Hyecode.
            }
        }
    }
}

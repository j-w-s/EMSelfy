fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new().app_manifest(tauri_build::AppManifest::new().commands(&[
            "win_minimize",
            "win_close",
            "win_toggle_maximize",
            "open_url",
            "read_text_file",
            "write_text_file",
        ])),
    )
    .expect("failed to run tauri-build");
}
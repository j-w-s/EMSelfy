use std::sync::{Arc, Mutex};

use tauri::{Emitter, Manager};
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;

struct SidecarState(Arc<Mutex<Option<CommandChild>>>);

#[tauri::command]
fn win_minimize(window: tauri::WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn win_close(window: tauri::WebviewWindow) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
async fn open_url(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener().open_url(url, None::<&str>).map_err(|e| e.to_string())
}

#[tauri::command]
async fn read_text_file(path: String) -> Result<String, String> {
    tokio::fs::read_to_string(path).await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_text_file(path: String, contents: String) -> Result<(), String> {
    tokio::fs::write(path, contents).await.map_err(|e| e.to_string())
}

fn kill_sidecar(state: &SidecarState) {
    if let Ok(mut guard) = state.0.lock() {
        if let Some(child) = guard.take() {
            let _ = child.kill();
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(SidecarState(Arc::new(Mutex::new(None))))
        .invoke_handler(tauri::generate_handler![
            win_minimize,
            win_close,
            open_url,
            read_text_file,
            write_text_file
        ])
        .setup(|app| {
            let app_handle = app.handle().clone();

            let (mut rx, child) = app
                .shell()
                .sidecar("emselfy-server")
                .expect("failed to create sidecar command")
                .spawn()
                .expect("failed to spawn emselfy-server sidecar");

            let state = app.state::<SidecarState>();
            if let Ok(mut guard) = state.0.lock() {
                *guard = Some(child);
            }

            tauri::async_runtime::spawn(async move {
                let mut stdout_buf = String::new();
                let mut ready = false;

                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            let text = String::from_utf8_lossy(&line);
                            stdout_buf.push_str(&text);

                            if ready {
                                continue;
                            }

                            let Some(idx) = stdout_buf.find("PORT:") else {
                                continue;
                            };

                            let rest = &stdout_buf[idx + "PORT:".len()..];
                            let port: String = rest.chars().take_while(|c| c.is_ascii_digit()).collect();

                            if port.is_empty() {
                                continue;
                            }

                            let url = format!("http://localhost:{}/html/index.html?port={}", port, port);
                            let Ok(parsed) = url.parse::<tauri::Url>() else {
                                log::error!("sidecar reported an unparseable port: {}", port);
                                continue;
                            };

                            if let Some(window) = app_handle.get_webview_window("main") {
                                let _ = window.navigate(parsed);
                                let _ = window.show();
                                let _ = window.set_focus();
                            }

                            let _ = app_handle.emit("sidecar-ready", port);
                            ready = true;
                        }
                        CommandEvent::Stderr(line) => {
                            log::warn!("emselfy-server: {}", String::from_utf8_lossy(&line));
                        }
                        CommandEvent::Error(err) => {
                            log::error!("emselfy-server error: {}", err);
                        }
                        CommandEvent::Terminated(payload) => {
                            log::error!("emselfy-server exited: {:?}", payload);
                            break;
                        }
                        _ => {}
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.app_handle().state::<SidecarState>();
                kill_sidecar(&state);
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| {
            if let tauri::RunEvent::ExitRequested { .. } = event {
                let state = app_handle.state::<SidecarState>();
                kill_sidecar(&state);
            }
        });
}

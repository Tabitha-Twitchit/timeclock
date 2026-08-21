use std::fs::File;
use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;

struct ServerProcess(Mutex<Option<Child>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn find_node() -> String {
    let candidates = [
        "/usr/local/bin/node",
        "/opt/homebrew/bin/node",
        "/usr/bin/node",
    ];

    for path in candidates {
        if std::path::Path::new(path).exists() {
            return path.to_string();
        }
    }

    // Fallback: ask the shell directly, same as running `which node` yourself
    if let Ok(output) = std::process::Command::new("which").arg("node").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return path;
            }
        }
    }

    // Last resort: hope it's on PATH
    "node".to_string()
}

// Windows sometimes returns paths with a "\\?\" verbatim prefix, which certain
// Node.js internals mishandle. Strip it if present; a no-op on Mac/Linux.
fn clean_windows_path(path: &std::path::Path) -> std::path::PathBuf {
    let path_str = path.to_string_lossy();
    let cleaned = path_str.strip_prefix(r"\\?\").unwrap_or(&path_str);
    std::path::PathBuf::from(cleaned)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // focus existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let resource_path = app
                .path()
                .resolve("backend/server.js", tauri::path::BaseDirectory::Resource)
                .expect("failed to resolve backend path");
            let resource_path = clean_windows_path(&resource_path);

            let working_dir = resource_path.parent()
                .expect("failed to get backend directory")
                .to_path_buf();

            let log_path = std::env::temp_dir().join("lafangitime-server.log");
            let mut log_file = File::create(&log_path)
                .expect("failed to create log file");

            writeln!(log_file, "Resolved server.js path: {:?}", resource_path).ok();
            writeln!(log_file, "Resolved working dir: {:?}", working_dir).ok();

            let log_file_err = log_file.try_clone().expect("failed to clone log handle");

            let node_path = find_node();
            writeln!(log_file.try_clone().unwrap(), "Using node at: {}", node_path).ok();

            let child = Command::new(&node_path)
                .arg(&resource_path)
                .current_dir(&working_dir)
                .stdout(Stdio::from(log_file))
                .stderr(Stdio::from(log_file_err))
                .spawn()
                .expect("Failed to start backend server");

            app.manage(ServerProcess(Mutex::new(Some(child))));

            use tauri_plugin_autostart::ManagerExt;
            let autostart_manager = app.autolaunch();
            let _ = autostart_manager.enable();

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                let state = window.state::<ServerProcess>();
                let mut guard = state.0.lock().unwrap();
                if let Some(mut child) = guard.take() {
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
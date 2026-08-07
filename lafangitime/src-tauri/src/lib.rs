use std::fs::File;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_autostart::MacosLauncher;

struct ServerProcess(Mutex<Option<Child>>);

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, None))
        .invoke_handler(tauri::generate_handler![greet])
        .setup(|app| {
            let resource_path = app
                .path()
                .resolve("backend/server.js", tauri::path::BaseDirectory::Resource)
                .expect("failed to resolve backend path");

            let working_dir = resource_path.parent()
                .expect("failed to get backend directory")
                .to_path_buf();

            // Diagnostics for paths
            // eprintln!("Resolved server.js path: {:?}", resource_path);
            // eprintln!("Resolved working dir: {:?}", working_dir);

            let log_file = File::create("/tmp/lafangitime-server.log")
                .expect("failed to create log file");
            let log_file_err = log_file.try_clone().expect("failed to clone log handle");

            let child = Command::new("node")
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
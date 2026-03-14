#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod preview_server;

use tauri::{Manager, Emitter};
use tokio::sync::Mutex;

#[tauri::command]
async fn start_preview_server(state: tauri::State<'_, Mutex<preview_server::PreviewServer>>) -> Result<u16, String> {
    let mut server = state.lock().await;
    server.start().await
}

#[tauri::command]
async fn stop_preview_server(state: tauri::State<'_, Mutex<preview_server::PreviewServer>>) -> Result<(), String> {
    let mut server = state.lock().await;
    server.stop();
    Ok(())
}

#[tauri::command]
async fn update_preview_content(state: tauri::State<'_, Mutex<preview_server::PreviewServer>>, html: String) -> Result<(), String> {
    let server = state.lock().await;
    server.update_content(html);
    Ok(())
}

#[tauri::command]
async fn get_pending_files(state: tauri::State<'_, Mutex<Vec<String>>>) -> Result<Vec<String>, String> {
    let mut files = state.lock().await;
    // Extract them to hand to frontend, then clear
    let to_return = files.clone();
    files.clear();
    Ok(to_return)
}

fn main() {
  tauri::Builder::default()
    // Single instance plugin - forwards args to existing instance
    .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
        let file_paths: Vec<String> = args
            .iter()
            .skip(1)
            .filter(|arg| !arg.starts_with('-'))
            .filter(|arg| std::path::Path::new(arg).exists())
            .cloned()
            .collect();

        if !file_paths.is_empty() {
            let _ = app.emit("open-files", file_paths);
        }

        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
            let _ = window.unminimize();
        }
    }))
    // Deep link plugin
    .plugin(tauri_plugin_deep_link::init())
    .setup(|app| {
        app.manage(Mutex::new(preview_server::PreviewServer::new()));

        let args: Vec<String> = std::env::args().collect();
        let file_paths: Vec<String> = args
            .iter()
            .skip(1)
            .filter(|arg| !arg.starts_with('-'))
            .filter(|arg| std::path::Path::new(arg).exists())
            .cloned()
            .collect();

        // Storing initial files into state to be picked up by the frontend
        app.manage(Mutex::new(file_paths));

        Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::window::minimize_window,
      commands::window::maximize_window,
      commands::window::unmaximize_window,
      commands::window::close_window,
      commands::window::is_maximized,
      commands::file::read_file,
      commands::file::write_file,
      commands::file::open_file_dialog,
      commands::file::save_file_dialog,
      commands::file::get_file_name,
      commands::file::detect_language_from_path,
      commands::file::get_file_modified_time,
      commands::file::open_folder_dialog,
      commands::file::read_directory,
      commands::file::rename_file,
      commands::file::delete_file,
      commands::file::open_file_explorer,
      commands::file::get_dir_name,
      commands::secrets::store_api_key,
      commands::secrets::get_api_key,
      commands::secrets::delete_api_key,
      commands::secrets::has_api_key,
      start_preview_server,
      stop_preview_server,
      update_preview_content,
      get_pending_files,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

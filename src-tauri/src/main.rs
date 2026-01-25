#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::{Manager, Emitter};

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
        let args: Vec<String> = std::env::args().collect();
        let file_paths: Vec<String> = args
            .iter()
            .skip(1)
            .filter(|arg| !arg.starts_with('-'))
            .filter(|arg| std::path::Path::new(arg).exists())
            .cloned()
            .collect();

        if !file_paths.is_empty() {
            let app_handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(500));
                let _ = app_handle.emit("open-files", file_paths);
            });
        }
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
      commands::file::open_file_explorer,
      commands::secrets::store_api_key,
      commands::secrets::get_api_key,
      commands::secrets::delete_api_key,
      commands::secrets::has_api_key,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

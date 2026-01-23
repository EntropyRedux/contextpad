#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
  tauri::Builder::default()
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

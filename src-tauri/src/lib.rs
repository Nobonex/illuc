mod tasks;

use tasks::{
    handle_select_base_repo, list_branches as list_branches_util,
    open_path_in_vscode as open_path_in_vscode_util,
    open_path_terminal as open_path_terminal_util, BaseRepoInfo, CreateTaskRequest, DiffPayload,
    DiffRequest, DiscardTaskRequest, StartTaskRequest, StopTaskRequest, TerminalResizeRequest,
    TerminalWriteRequest, TaskActionRequest, TaskManager, TaskSummary,
};

type CommandResult<T> = std::result::Result<T, String>;

#[tauri::command]
async fn select_base_repo(path: String) -> CommandResult<BaseRepoInfo> {
    handle_select_base_repo(path).map_err(|err| err.to_string())
}

#[tauri::command]
async fn create_task(
    manager: tauri::State<'_, TaskManager>,
    app_handle: tauri::AppHandle,
    req: CreateTaskRequest,
) -> CommandResult<TaskSummary> {
    manager
        .create_task(req, &app_handle)
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn start_task(
    manager: tauri::State<'_, TaskManager>,
    app_handle: tauri::AppHandle,
    req: StartTaskRequest,
) -> CommandResult<TaskSummary> {
    manager
        .start_task(req, &app_handle)
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn stop_task(
    manager: tauri::State<'_, TaskManager>,
    app_handle: tauri::AppHandle,
    req: StopTaskRequest,
) -> CommandResult<TaskSummary> {
    manager
        .stop_task(req, &app_handle)
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn discard_task(
    manager: tauri::State<'_, TaskManager>,
    app_handle: tauri::AppHandle,
    req: DiscardTaskRequest,
) -> CommandResult<()> {
    manager
        .discard_task(req, &app_handle)
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn terminal_write(
    manager: tauri::State<'_, TaskManager>,
    req: TerminalWriteRequest,
) -> CommandResult<()> {
    manager.terminal_write(req).map_err(|err| err.to_string())
}

#[tauri::command]
async fn terminal_resize(
    manager: tauri::State<'_, TaskManager>,
    req: TerminalResizeRequest,
) -> CommandResult<()> {
    manager.terminal_resize(req).map_err(|err| err.to_string())
}

#[tauri::command]
async fn get_diff(
    manager: tauri::State<'_, TaskManager>,
    req: DiffRequest,
) -> CommandResult<DiffPayload> {
    manager.get_diff(req).map_err(|err| err.to_string())
}

#[tauri::command]
async fn load_existing_worktrees(
    manager: tauri::State<'_, TaskManager>,
    app_handle: tauri::AppHandle,
    base_repo_path: String,
) -> CommandResult<Vec<TaskSummary>> {
    manager
        .register_existing_worktrees(base_repo_path, &app_handle)
        .map_err(|err| err.to_string())
}

#[tauri::command]
async fn open_worktree_in_vscode(
    manager: tauri::State<'_, TaskManager>,
    req: TaskActionRequest,
) -> CommandResult<()> {
    manager.open_in_vscode(req).map_err(|err| err.to_string())
}

#[tauri::command]
async fn open_worktree_terminal(
    manager: tauri::State<'_, TaskManager>,
    req: TaskActionRequest,
) -> CommandResult<()> {
    manager.open_terminal(req).map_err(|err| err.to_string())
}

#[tauri::command]
async fn open_path_in_vscode(path: String) -> CommandResult<()> {
    open_path_in_vscode_util(&path).map_err(|err| err.to_string())
}

#[tauri::command]
async fn open_path_terminal(path: String) -> CommandResult<()> {
    open_path_terminal_util(&path).map_err(|err| err.to_string())
}

#[tauri::command]
async fn list_branches(path: String) -> CommandResult<Vec<String>> {
    list_branches_util(path).map_err(|err| err.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(TaskManager::default())
        .invoke_handler(tauri::generate_handler![
            select_base_repo,
            create_task,
            start_task,
            stop_task,
            discard_task,
            terminal_write,
            terminal_resize,
            get_diff,
            load_existing_worktrees,
            open_worktree_in_vscode,
            open_worktree_terminal,
            open_path_in_vscode,
            open_path_terminal,
            list_branches
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

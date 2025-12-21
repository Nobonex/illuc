import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { open } from "@tauri-apps/plugin-dialog";
import { TaskSidebarComponent } from "./tasks/components/task-sidebar/task-sidebar.component";
import { TaskViewComponent } from "./tasks/components/task-view/task-view.component";
import { TaskStore } from "./tasks/task.store";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TaskSidebarComponent,
    TaskViewComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  statusMessage = "";
  showCreateModal = false;
  branchNameInput = "";
  branchNameError = "";
  confirmDiscardTaskId: string | null = null;
  confirmDiscardTitle = "";
  confirmDiscardBranch = "";
  confirmDiscardError = "";

  constructor(public readonly taskStore: TaskStore) {}

  tasks() {
    return this.taskStore.tasks();
  }

  selectedTask() {
    return this.taskStore.selectedTask();
  }

  baseRepo() {
    return this.taskStore.baseRepo();
  }

  async browseForRepo(): Promise<void> {
    const selection = await open({
        directory: true,
        multiple: false,
        title: "Select base repository",
    });
    if (typeof selection === "string") {
      await this.loadBaseRepo(selection);
    }
  }

  private async loadBaseRepo(path: string): Promise<void> {
    try {
      await this.taskStore.selectBaseRepo(path);
      this.statusMessage = `Loaded repository: ${path}`;
    } catch (error: unknown) {
      this.statusMessage = this.describeError(
        error,
        "Unable to open the selected repository.",
      );
    }
  }

  openCreateTaskModal(): void {
    if (!this.baseRepo()) {
      this.statusMessage = "Select a base repository before creating tasks.";
      return;
    }
    this.branchNameInput = "";
    this.branchNameError = "";
    this.showCreateModal = true;
  }

  closeCreateTaskModal(): void {
    this.showCreateModal = false;
    this.branchNameInput = "";
    this.branchNameError = "";
  }

  async submitNewTask(): Promise<void> {
    const branch = this.branchNameInput.trim();
    if (!branch) {
      this.branchNameError = "Branch name is required.";
      return;
    }
    if (!this.baseRepo()) {
      this.branchNameError = "Select a base repository first.";
      return;
    }
    this.branchNameError = "";
    const title = this.deriveTitleFromBranch(branch);
    try {
      await this.taskStore.createTask(branch, title);
      this.statusMessage = `Task created on ${branch}.`;
      this.closeCreateTaskModal();
    } catch (error: unknown) {
      this.branchNameError = this.describeError(
        error,
        "Unable to create task.",
      );
    }
  }

  async startTask(taskId: string): Promise<void> {
    try {
      await this.taskStore.startTask(taskId);
      this.statusMessage = "Task started.";
    } catch (error: unknown) {
      this.statusMessage = this.describeError(
        error,
        "Unable to start task.",
      );
    }
  }

  async stopTask(taskId: string): Promise<void> {
    try {
      await this.taskStore.stopTask(taskId);
      this.statusMessage = "Task stopped.";
    } catch (error: unknown) {
      this.statusMessage = this.describeError(error, "Unable to stop task.");
    }
  }

  discardTask(taskId: string): void {
    const task =
      this.taskStore.tasks().find((wf) => wf.taskId === taskId) ??
      null;
    this.confirmDiscardTaskId = taskId;
    this.confirmDiscardTitle = task?.title ?? "Selected task";
    this.confirmDiscardBranch = task?.branchName ?? "";
    this.confirmDiscardError = "";
  }

  selectTask(taskId: string): void {
    this.taskStore.selectTask(taskId);
  }

  cancelDiscardTask(): void {
    this.confirmDiscardTaskId = null;
    this.confirmDiscardTitle = "";
    this.confirmDiscardBranch = "";
    this.confirmDiscardError = "";
  }

  async confirmDiscardTask(): Promise<void> {
    if (!this.confirmDiscardTaskId) {
      return;
    }
    try {
      await this.taskStore.discardTask(this.confirmDiscardTaskId);
      this.statusMessage = "Task discarded and cleaned up.";
      this.cancelDiscardTask();
    } catch (error: unknown) {
      this.confirmDiscardError = this.describeError(
        error,
        "Unable to discard task.",
      );
    }
  }

  private describeError(error: unknown, fallback: string): string {
    if (typeof error === "string") {
      return error;
    }
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message: string }).message);
    }
    return fallback;
  }

  private deriveTitleFromBranch(branchName: string): string {
    const slug = branchName.split("/").pop() ?? branchName;
    const taskMatch = slug.match(/(\d{3,})/);
    const taskId = taskMatch ? taskMatch[1] : null;
    let remainder = slug;
    if (taskMatch) {
      remainder = remainder.replace(taskMatch[1], "");
    }
    remainder = remainder.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
    if (!remainder) {
      remainder = branchName.replace(/[-_/]+/g, " ").trim();
    }
    const human = remainder
      ? remainder
          .split(" ")
          .filter(Boolean)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(" ")
      : branchName;
    return taskId ? `[${taskId}] ${human}` : human;
  }
}

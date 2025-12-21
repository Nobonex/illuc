import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

@Component({
  selector: "app-open-vscode-button",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./open-vscode-button.component.html",
  styleUrl: "./open-vscode-button.component.css",
})
export class OpenVsCodeButtonComponent {
  @Input() path: string | null = null;
  @Input() title = "Open in VS Code";
  @Input() ariaLabel = "Open in VS Code";

  async handleClick(): Promise<void> {
    if (!this.path) {
      return;
    }
    try {
      await invoke("open_path_in_vscode", { path: this.path });
    } catch (error) {
      console.error("Failed to open VS Code", error);
    }
  }
}

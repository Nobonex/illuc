import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { invoke } from "@tauri-apps/api/core";

@Component({
  selector: "app-open-terminal-button",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./open-terminal-button.component.html",
  styleUrl: "./open-terminal-button.component.css",
})
export class OpenTerminalButtonComponent {
  @Input() path: string | null = null;
  @Input() title = "Open terminal";
  @Input() ariaLabel = "Open terminal";

  async handleClick(): Promise<void> {
    if (!this.path) {
      return;
    }
    try {
      await invoke("open_path_terminal", { path: this.path });
    } catch (error) {
      console.error("Failed to open terminal", error);
    }
  }
}

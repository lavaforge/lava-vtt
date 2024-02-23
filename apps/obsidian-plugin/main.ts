import { FileSystemAdapter, Menu, Plugin, TFile } from "obsidian";

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
  async onload() {
    this.registerDomEvent(document, "contextmenu", (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.localName !== "img") return;

      const imgPath = (target as HTMLImageElement).currentSrc;
      // @ts-expect-error
      const file = this.app.vault.resolveFileUrl(imgPath);

      if (!(file instanceof TFile)) return;
      if (!(this.app.vault.adapter instanceof FileSystemAdapter)) return;

      const adapter = this.app.vault.adapter;

      const menu = new Menu();
      menu.addItem((item) => {
        item.setTitle(`Open ${adapter.getFullPath(file.path)}`).onClick(() =>
          fetch("http://localhost:3000/api/new-image", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: adapter.getFullPath(file.path) }),
          }),
        );
      });

      menu.showAtPosition({ x: event.pageX, y: event.pageY });
    });
  }

  onunload() {}
}

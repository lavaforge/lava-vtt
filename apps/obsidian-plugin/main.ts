import { FileSystemAdapter, Menu, Plugin, TFile } from 'obsidian';
import { promises as fs } from 'fs';
import { hashBuffer } from 'shared';

// Remember to rename these classes and interfaces!

export default class MyPlugin extends Plugin {
  private apiVersion: string | undefined = undefined;

  async onload() {
    this.registerDomEvent(document, 'contextmenu', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.localName !== 'img') return;

      const imgPath = (target as HTMLImageElement).currentSrc;
      // @ts-expect-error resolveFileUrl is not part of the public API
      const file = this.app.vault.resolveFileUrl(imgPath);

      if (!(file instanceof TFile)) return;
      if (!(this.app.vault.adapter instanceof FileSystemAdapter)) return;

      const adapter = this.app.vault.adapter;

      const menu = new Menu();
      menu.addItem((item) => {
        item
          .setTitle(`Open ${adapter.getFullPath(file.path)}`)
          .onClick(async () => {
            if (this.apiVersion === undefined) {
              // fetch from /api/version. if route is not found, use version v0
              await fetch('http://localhost:3000/api/version')
                .then((res) => res.json())
                .then((data) => {
                  this.apiVersion = data.version;
                  console.log('API VERSION', this.apiVersion);
                })
                .catch(() => {
                  this.apiVersion = 'v0';
                  console.log('API VERSION', this.apiVersion);
                });
            }

            if (this.apiVersion === 'v0') {
              return fetch('http://localhost:3000/api/new-image', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: adapter.getFullPath(file.path) }),
              });
            } else if (this.apiVersion === 'v1') {
              const fileContent = await fs.readFile(
                adapter.getFullPath(file.path),
              );

              const hash = hashBuffer(fileContent);
              console.log('other hash', hash);

              const headResponse = await fetch(
                `http://localhost:3000/api/image/${hash}`,
                {
                  method: 'HEAD',
                },
              );

              if (headResponse.status !== 200) {
                console.log('uploading new image');
                await fetch('http://localhost:3000/api/image', {
                  method: 'POST',
                  body: fileContent, // Send the file content as the body
                  headers: {
                    // Set appropriate headers if needed (e.g., for file type)
                    'Content-Type': 'application/octet-stream',
                  },
                });
              } else {
                console.log('image already exists, no upload necessary');
              }

              await fetch('http://localhost:3000/api/display', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ hash }),
              });
            } else {
              throw new Error(
                'Unknown API version, please update this plugin!',
              );
            }
          });
      });

      menu.showAtPosition({ x: event.pageX, y: event.pageY });
    });
  }

  onunload() {}
}

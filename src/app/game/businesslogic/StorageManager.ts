import { GameModel } from "../model/Game";
import { Settings } from "../model/Settings";

export class StorageManager {

  db: IDBDatabase | undefined;

  init(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      if (window.indexedDB) {
        const request: IDBOpenDBRequest = window.indexedDB.open('ghs-db', 1);

        request.onupgradeneeded = (event: any) => {
          console.debug("Upgrade DB", event);
          const db = event.target.result;
          if (event.oldVersion < 1) {
            db.createObjectStore('game');
            db.createObjectStore('settings');
            db.createObjectStore('undo', { autoIncrement: true });
            db.createObjectStore('redo', { autoIncrement: true });
            db.createObjectStore('undo-infos', { autoIncrement: true });
            db.createObjectStore('game-backup', { autoIncrement: true });
          }
        }

        request.onsuccess = (event: any) => {
          this.db = event.target.result;
          // migration
          if (localStorage.getItem('ghs-game')) {
            this.migrate();
          }
          resolve(true);
        }

        request.onerror = (event: any) => {
          this.db = undefined;
          console.error("db error", request.error, event);
          console.warn("No IndexedDB, fallback to Local Storage");
          reject(false);
        }
      } else {
        this.db = undefined;
        console.warn("No IndexedDB, fallback to Local Storage");
        reject(false);
      }
    });
  }

  writeGameModel(gameModel: GameModel) {
    this.write('game', 'default', gameModel);
  }

  readGameModel(): Promise<GameModel> {
    return this.read<GameModel>('game', 'default');
  }

  addBackup(gameModel: GameModel) {
    if (this.db) {
      this.write('game-backup', undefined, gameModel);
    } else {
      let count = 1;
      let backup = localStorage.getItem("ghs-game-backup-" + count);
      while (backup) {
        count++;
        backup = localStorage.getItem("ghs-game-backup-" + count);
      }
      localStorage.setItem("ghs-game-backup-" + count, JSON.stringify(gameModel));
    }
  }

  read<T>(store: string, key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, "readwrite");
        const objectStore = transaction.objectStore(store);
        const request = objectStore.get(key);
        request.onsuccess = (event: any) => {
          const objec: T = event.target.result;
          resolve(objec);
        };

        request.onerror = (event: any) => {
          console.error("read " + store + " failed", event);
          reject(event);
        };
      } else {
        const local: string | null = localStorage.getItem("ghs-" + store);
        if (local) {
          resolve(JSON.parse(local) as T);
        } else {
          reject(null);
        }
      }
    })
  }

  write(store: string, key: string | undefined, object: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, "readwrite");
        const objectStore = transaction.objectStore(store);
        const request = objectStore.put(object, key);
        request.onsuccess = (event: any) => {
          resolve();
        }
        request.onerror = (event: any) => {
          console.error("update " + store + " failed", event);
          reject();
        };
      } else {
        localStorage.setItem("ghs-" + store, JSON.stringify(object));
        resolve();
      }
    })
  }

  remove(store: string, key: string = 'default') {
    if (this.db) {
      const transaction = this.db.transaction(store, "readwrite");
      const objectStore = transaction.objectStore(store);
      const request = objectStore.delete(key)
      request.onerror = (event: any) => {
        console.error("delete " + key + " from " + store + " failed", event);
      };
    } else {
      localStorage.removeItem("ghs-" + store);
    }
  }

  readAll<T>(store: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        const transaction = this.db.transaction(store, "readwrite");
        const objectStore = transaction.objectStore(store);
        const request = objectStore.getAll()
        request.onsuccess = (event: any) => {
          const objects: T[] = event.target.result;
          resolve(objects);
        };

        request.onerror = (event: any) => {
          console.error("read " + store + " failed", event);
          reject(event);
        };
      } else {
        const local: string | null = localStorage.getItem("ghs-" + store);
        if (local) {
          resolve(JSON.parse(local) as T[]);
        } else {
          reject(null);
        }
      }
    })
  }

  async writeArray(store: string, objects: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.clear(store);
        objects.forEach(async (object) => {
          await this.write(store, undefined, object).catch(() => reject());
        });
      } else {
        localStorage.setItem("ghs-" + store, JSON.stringify(objects));
      }
      resolve();
    })
  }

  clear(store: string | undefined = undefined): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        if (store) {
          const transaction = this.db.transaction(store, "readwrite");
          const objectStore = transaction.objectStore(store);
          const request = objectStore.clear();
          request.onsuccess = (event: any) => {
            resolve();
          }
          request.onerror = (event: any) => {
            console.error("delete " + store + " failed", event);
            reject(request.error);
          };
        } else {
          const request = window.indexedDB.deleteDatabase('ghs-db');
          request.onsuccess = (event: any) => {
            resolve();
          }
          request.onblocked = (event: any) => {
            if (this.db) {
              this.db.close();
            }
          }
          request.onerror = (event: any) => {
            console.error("delete database 'ghs-db' failed", event);
            reject(request.error);
          };
        }
      } else {
        if (store) {
          localStorage.removeItem("ghs-" + store);
          resolve();
        } else {
          localStorage.clear();
          if (window.indexedDB) {
            const request = window.indexedDB.deleteDatabase('ghs-db');
            request.onsuccess = (event: any) => {
              resolve();
            }
            request.onblocked = (event: any) => {
              if (this.db) {
                this.db.close();
              }
            }
            request.onerror = (event: any) => {
              console.error("delete database 'ghs-db' failed", event);
              reject(request.error);
            };
          } else {
            resolve();
          }
        }
      }
    })
  }

  async datadump(migrate: boolean = false): Promise<any> {
    let datadump: any = {};
    if (this.db && !migrate) {
      datadump['game'] = await this.readGameModel();
      datadump['settings'] = await this.read('settings', 'default');
      datadump['undo'] = await this.readAll('undo');
      datadump['redo'] = await this.readAll('redo');
      datadump['undo-infos'] = await this.readAll('undo-infos');
      datadump['game-backup'] = await this.readAll('game-backup');
    } else {
      if (!migrate) {
        console.warn("No IndexedDB, fallback to Local Storage");
      }
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const data = localStorage.getItem(key);
          if (data) {
            datadump[key] = JSON.parse(data);
          }
        }
      };
    }

    return Promise.resolve(datadump);
  }

  async migrate() {
    console.warn("Migration of old local storage");

    try {
      let datadump: any = await storageManager.datadump(true);
      let downloadButton = document.createElement('a');
      downloadButton.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(datadump)));
      downloadButton.setAttribute('download', "ghs-migration-backup.json");
      document.body.appendChild(downloadButton);
      downloadButton.click();
      document.body.removeChild(downloadButton);
    } catch {
      console.warn("Could not read datadump");
    }

    const gameString: string | null = localStorage.getItem("ghs-game");
    if (gameString) {
      let game = JSON.parse(gameString);
      this.write('game', 'default', game).then(() => {
        localStorage.removeItem('ghs-game');
      }).catch();
    }

    const settingsString: string | null = localStorage.getItem("ghs-settings");
    if (settingsString) {
      let settings = JSON.parse(settingsString);
      this.write('settings', 'default', Object.assign(new Settings(), settings)).then(() => {
        localStorage.removeItem('ghs-settings');
      }).catch();
    }

    const undoString: string | null = localStorage.getItem("ghs-undo");
    if (undoString != null) {
      let undos = JSON.parse(undoString);
      let count = 1;
      let additionalUndoString = localStorage.getItem("ghs-undo-" + count);
      while (additionalUndoString) {
        const additionalUndo: GameModel[] = JSON.parse(additionalUndoString);
        undos.push(...additionalUndo);
        count++;
        additionalUndoString = localStorage.getItem("ghs-undo-" + count);
      }

      this.writeArray('undo', undos).then(() => {
        localStorage.removeItem('ghs-undo');
        let additionalUndoString = localStorage.getItem("ghs-undo-" + count);
        while (additionalUndoString) {
          localStorage.removeItem("ghs-undo-" + count);
          count++;
          additionalUndoString = localStorage.getItem("ghs-undo-" + count);
        }
      }).catch();
    }
    const redoString: string | null = localStorage.getItem("ghs-redo");
    if (redoString != null) {
      let redos = JSON.parse(redoString);
      let count = 1;
      let additionalRedoString = localStorage.getItem("ghs-redo-" + count);
      while (additionalRedoString) {
        const additionalRedo: GameModel[] = JSON.parse(additionalRedoString);
        redos.push(...additionalRedo);
        count++;
        additionalRedoString = localStorage.getItem("ghs-redo-" + count);
      }

      this.writeArray('redo', redos).then(() => {
        localStorage.removeItem('ghs-redo');
        let additionalRedoString = localStorage.getItem("ghs-redo-" + count);
        while (additionalRedoString) {
          localStorage.removeItem("ghs-redo-" + count);
          count++;
          additionalRedoString = localStorage.getItem("ghs-redo-" + count);
        }
      }).catch();
    }

    const undoInfosString: string | null = localStorage.getItem("ghs-undo-infos");
    if (undoInfosString != null) {
      let undoInfos = JSON.parse(undoInfosString);
      let count = 1;
      let additionalUndoInfosString = localStorage.getItem("ghs-undo-infos-" + count);
      while (additionalUndoInfosString) {
        const additionalUndoInfos: string[][] = JSON.parse(additionalUndoInfosString);
        undoInfos.push(...additionalUndoInfos);
        count++;
        additionalUndoInfosString = localStorage.getItem("ghs-undo-infos-" + count);
      }

      this.writeArray('undo-infos', undoInfos).then(() => {
        localStorage.removeItem('ghs-undo-infos');
        let additionalUndoInfosString = localStorage.getItem("ghs-undo-infos-" + count);
        while (additionalUndoInfosString) {
          localStorage.removeItem("ghs-undo-infos-" + count);
          count++;
          additionalUndoInfosString = localStorage.getItem("ghs-undo-infos-" + count);
        }
      }).catch();
    }

    let count = 1;
    let backup = localStorage.getItem("ghs-game-backup-" + count);
    while (backup) {
      this.write('game-backup', undefined, backup).then(() => {
        localStorage.removeItem("ghs-game-backup-" + count);
      }).catch();
      count++;
      backup = localStorage.getItem("ghs-game-backup-" + count);
    }
  }

}


export const storageManager: StorageManager = new StorageManager();
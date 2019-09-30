import Plugin from "../../structures/plugin/plugin";
import MemoryStorage from "./MemoryStorage";
import FileStorage from './FileStorage';

export {
  FileStorage,
  MemoryStorage
}

export * from './types';

/**
 * The main storage plugin (storage of storages)
 */
export class Storage extends Plugin {
  public name = "storage";
  public storages = new Map<string,FileStorage| MemoryStorage>();

  /**
   * Creates new storage and returns created storage
   * @param storageKey Storage name which will be saved in the main storage
   * @param storageValue Default storage data 
   * @param destinition File path which will be used to storage storage data
   */
  createStorage (storageKey:string, storageValue:Record<string, any>, destinition:string):FileStorage| MemoryStorage {
    if (this.has(storageKey)) throw new Error('This storage key already have!');
    
    let storage:FileStorage| MemoryStorage;

    if (destinition) {
      // Is a file storage, need create read stream and write stream
      storage = new FileStorage(storageKey, storageValue, destinition);
    } else {
      storage = new  MemoryStorage(storageKey, storageValue);
    }

    this.storages.set(storageKey, storage);
    return storage;
  }

  /**
   * Checks that this storage has in main storage
   * @param storageKey Storage name
   */
  has (storageKey:string):boolean {
    return this.storages.has(storageKey);
  }

  onEnable () {
    this.vk.link(this.name, this);
  }

  /**
   * Returns storage by name
   * @param storageKey Storage name
   */
  get (storageKey:string):FileStorage| MemoryStorage{
    return this.storages.get(storageKey);
  }
}

export default Storage;
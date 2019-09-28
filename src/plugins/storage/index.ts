import Plugin from "../../structures/plugin/plugin";
import { readFileSync, writeFileSync, openSync, closeSync} from "fs";


/**
 * Main Storage type
 */
export interface IStorage {
  /** Key for storage */
  storageName:string
  /** Storage data which will be saved */
  storageData:Record<string, any>
  [key:string]:any
} 

/**
 * Interface for file typed storage (all data in file system storage)
 */
export interface IFileStorage extends IStorage {
  /** File path */
  fileDestinition:string
}

export class WrapStorage implements IStorage {
 public storageData:Record<string, any>;
 public storageName:string;

 /**
  * 
  * @param name storagename which will be used in other wrappers
  * @param data data storage which need to save
  */
 constructor (name:string, data:Record<string, any>) {
    this.storageData = data;
    this.storageName = name;
 }

 /**
  * Returns true if this key declared in storage
  * @param key Key name f storage data
  */
 has (key:string):boolean {
  return this.storageData[key] !== undefined;
 }

 /**
  * Returns value of storage by this key
  * @param key Key name f storage data
  */
 get (key:string):any {
   if (this.hasOwnProperty(key)) return this[key];
   return this.storageData[key];
 }

 /**
  * Sets this value for this key in storage (saving data)
  * @param key Key name f storage data
  * @param value Value
  */
 set (key, value):WrapStorage {
   this.storageData[key] = value;
   return this;
 }

 /**
  * Converting all storage to JSON format
  */
 toJSON () {
  return JSON.stringify(this.storageData);
 }

 /**
  * Returns storage as a string object
  */
 [Symbol("toString")]() {
   return this.toJSON();
 }

}


export class FileStorage extends WrapStorage implements IFileStorage {
  public fileDestinition:string;
  
  /**
   * 
   * @param name name for file storage (see WrapStorage)
   * @param data data storage (see WrapStorage)
   * @param fileD file destination (path) which will be used to stora data
   * @param merge if true then new data will merge to old data, if false then all data will be updated to new
   */
  constructor (name:string, data:Record<string, any>, fileD:string, merge:boolean=true) {
    super(name, data);
    
    this.fileDestinition = fileD;
    closeSync(openSync(this.fileDestinition, "a+"));
    
    if (merge) {
      this.mergeAll();
    } else {
      this.sync();
    }
  }

  /**
   * Updates data object to new data, or adding new parameters to already exists
   * @param newData new data object
   * @param strict If true then all data will be updated without saving old else datas will be separated
   */
  update (newData:Record<string, any>, strict:boolean=false) {

    if (strict) {
      this.storageData = {...newData};
    } else {
      
      let data = {
        ...this.storageData,
        ...newData
      }

      this.storageData = data;
    }

    return this.sync();
  }

  /**
   * Merges data from file destination to new data
   */
  mergeAll ():FileStorage {
    let fileData = this.getFileData();
    let data = {
      ...fileData,
      ...this.storageData
    }

    this.storageData = data;
    return this.sync();
  }

  /**
   * Returns a file data
   */
  getFileData ():Record<string, any> {
    let data = readFileSync(this.fileDestinition, 'utf8');


    if (data && data[0] === "{" && data[data.length - 1] === "}") {
      return JSON.parse(data.toString());
    }

    return {}
  }

  /**
   * Sets a value for this key
   * @param key Key name storage
   * @param value Data storage
   */
  set (key:string, value:Record<string, any>):FileStorage {
    super.set(key, value);
    return this.sync();
  }

  /**
   * Synchronizes all data (file and RAM)
   */
  sync ():FileStorage {
    writeFileSync(this.fileDestinition, this.toJSON(), 'utf8');
    return this;
  }
}

/**
 * The main storage plugin (storage of storages)
 */
export class Storage extends Plugin {
  public name = "storage";
  public storages = new Map<string,FileStorage|WrapStorage>();

  /**
   * Creates new storage and returns created storage
   * @param storageKey Storage name which will be saved in the main storage
   * @param storageValue Default storage data 
   * @param destinition File path which will be used to storage storage data
   */
  createStorage (storageKey:string, storageValue:Record<string, any>, destinition:string):FileStorage|WrapStorage {
    if (this.has(storageKey)) throw new Error('This storage key already have!');
    
    let storage:FileStorage|WrapStorage;

    if (destinition) {
      // Is a file storage, need create read stream and write stream
      storage = new FileStorage(storageKey, storageValue, destinition);
    } else {
      storage = new WrapStorage(storageKey, storageValue);
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
  get (storageKey:string):FileStorage|WrapStorage{
    return this.storages.get(storageKey);
  }
}

export default Storage;
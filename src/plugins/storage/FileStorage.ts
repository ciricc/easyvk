import { readFileSync, writeFileSync, openSync, closeSync} from "fs";

import { IFileStorage } from "./types";
import MemoryStorage from "./MemoryStorage";

export default class FileStorage extends  MemoryStorage implements IFileStorage {
  public fileDestinition:string;
  
  /**
   * 
   * @param name name for file storage (see  MemoryStorage)
   * @param data data storage (see  MemoryStorage)
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
  update (newData:Record<string, any>, strict:boolean=false):this {

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
  mergeAll ():this {
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
  set (key:string, value:Record<string, any>, needSync:boolean = true):this {
    super.set(key, value);
    return (needSync) ? this.sync() : this;
  }

  /**
   * Synchronizes all data (file and RAM)
   */
  sync ():this {
    writeFileSync(this.fileDestinition, this.toJSON(), 'utf8');
    return this;
  }
}
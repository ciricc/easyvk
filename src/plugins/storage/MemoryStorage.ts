import { IStorage } from "./types";

export default class  MemoryStorage implements IStorage<any> {
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
  set (key, value): MemoryStorage {
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
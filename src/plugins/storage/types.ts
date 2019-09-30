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
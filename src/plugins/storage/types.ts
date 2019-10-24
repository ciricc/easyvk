/**
 * Main Storage type
 */
export interface IStorage<T> {
  /** Key for storage */
  storageName:string
  /** Storage data which will be saved */
  storageData:Record<string, any>|Array<T>
  [key:string]:any
} 

/**
 * Interface for file typed storage (all data in file system storage)
 */
export interface IFileStorage<T> extends IStorage<T> {
  /** File path */
  fileDestinition:string
}
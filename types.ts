export interface IVKOptions {
    /** Run mode */
    mode: "highload" | "default"
    /** Default request parameters */
    defaults: {
        [key:string]:any
    }
}

export interface IVKOptions {
    /** Run mode */
    mode: "highload" | "default"
    /** Default request parameters */
    defaults: {
        [key:string]:any
    },
    api: {
        /** Default protocol for APi request */
        protocol:string
        /** Default API subdomain ({api}.vk.com) */
        apiSubdomain:string
        /** Default VK domain ({vk.com}) */
        domain:string
        /** Default methodPath (api.vk.com/{method/}) */
        methodPath:string
        /** Default oauth subdomain ({oauth}.vk.com) */
        oauthSubdomain:string
    },
    /** Proxy address for all library requests */
    proxy?: string
}

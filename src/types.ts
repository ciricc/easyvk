export interface IVKOptions {
    /** Run mode */
    mode: "highload" | "default"
    /** Default request parameters */
    defaults: {
        [key:string]:any
    },
    /** Default options for API requests */
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
    /** Options for auth-support plugins */
    auth: {
        /** Method for auth with group token */
        groupsMethod:string
        /** Method for auth with user token */
        usersMethod:string
        /** Method for auth with app token */
        appsMethod:string
        /** grant_type for password and username */
        passwordGrantType:string
        /** Device id string */
        deviceId:string
    }
    /** Proxy address for all library requests */
    proxy?: string
}

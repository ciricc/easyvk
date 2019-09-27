import Plugin from "../../structures/plugin/plugin";

/** Type of supported platforms for authenticate user */
const Platforms = {
    Android: {
        client: {
            id: 2274003,
            secret: "hHbZxrka2uZ6jB1inYsH"  
        },
        name: "ANDROID"
    },
    IOS: {
        client: {
            id: 3140623,
            secret: "VeWdmVclDCtn6ihuP1nt"
        },
        name: "IOS"
    },
    Windows: {
        client: {
            id: 3697615,
            secret: "AlVXZFMUqyrnABp8ncuU"
        },
        name: "Windows Client"
    }
}

interface IAuthOptions {
    /** Accesss token for requests (group, user, app) */
    token?:string
    /** Username on vk.com */
    username?:string|number
    /** Password */
    password?:string
    /** Applications id which will be used for authenticate user */
    clientId?:string|number
    /** Application secret which will be used for authenticate user */
    clientSecret?:string 
}

class Auth extends Plugin {
    public name = "auth";
    public options:IAuthOptions = {}

    async onEnable (options: IAuthOptions) {
        // return this.init();
    }
}

export default Auth;
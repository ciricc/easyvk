import VK from "../../vk";
import { ComposerName } from "../../types";

class Plugin {
    public vk:VK;
    /** Plugin name (unique) */
    public name = "defaultPlugin";
    /** Plugin author */
    public author = "noName";
    /** Plugin version */
    public version = "1.0.0";
    /** Plugin options */
    public options:any = {};
    /** Plugin names which need for usage and install this plugin */
    public requirements = [];
    /** Plugin name which after this plugin will be installed */
    public setupAfter:string;
    
    public middlewares:ComposerName[];

    constructor (vk:VK, options:any) {
        this.vk = vk;
        this.options = options;
    }

    /**
     * Fires when plugin is enabled
     */
    onEnable (options:any) {

    }

    /** 
     * Checks that plugin has updates
     * You can redefined this method when developing your own plugins
     */
    hasUpdates ():boolean {
        return false;
    }
}

export type PluginIniter = (vk:VK, options:any) => Plugin;

export default Plugin;
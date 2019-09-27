import VK from "../../vk";

class Plugin {
    public vk:VK;
    /** Plugin name (unique) */
    public name = "defaultPlugin";
    /** Plugin options */
    public options = {};
    /** Plugin names which need for usage and install this plugin */
    public requirements = [];
    /** Plugin name which after this plugin will be installed */
    public setupAfter:string;

    constructor (vk, options) {
        this.vk = vk;
        this.options = options;
    }

    /**
     * Fires when plugin is enabled
     */
    onEnable (options:any) {

    }
}

export default Plugin;
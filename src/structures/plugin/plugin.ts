import VK from "../../vk";

class Plugin {
    public vk:VK;
    public name = "defaultPlugin";
    public options = {};
    public requirements = [];

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
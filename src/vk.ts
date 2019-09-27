import { IVKOptions } from './types';
import API from './structures/api/api';
import Plugin from './structures/plugin/plugin';

class VK {
    
    public defaultsOptions;
    public options:IVKOptions = {
        mode: 'default',
        defaults: {
            v: '5.101',
            lang: 'ru'
        }
    };
    
    public pluginsQueue = [];
    public plugins = [];

    public api = new API(this);
    public queuePromises = [];

    constructor (options:IVKOptions) {
        this.setOptions(options);
        this.defaults(this.options.defaults);
    }

    public setOptions (options:IVKOptions):VK {
        this.options = {
            ...this.options,
            ...options
        }

        return this;
    }

    public defaults (options: {[key:string]:any}):VK {
        
        this.defaultsOptions = {
            ...this.defaultsOptions,
            ...options
        }

        return this;
    }


    public async addPlugin (plugin: typeof Plugin, pluginOptions:{[key:string]: any}, addInQueue:boolean=false) {
        let plugIn = new plugin(this, pluginOptions);
        
        if (!plugIn.name || plugIn.name === "defaultPlugin") throw new Error('Plugin must have unique name');
        if (this.hasPlugin(plugIn.name)) throw new Error('This plugin already installed');

        const newPlugin = {
            plugin: plugIn,
            options: pluginOptions
        }

        if (plugIn.requirements) {
            for (let requiredPluginName of plugIn.requirements) {
                if (this.hasPlugin(requiredPluginName)) continue;
                throw new Error(`Plugin requires a ${requiredPluginName} plugin. You should install this plugin!`);
            }
        }

        if (plugIn.setupAfter && addInQueue) {
            let setupAfterIndex = this.pluginsQueue.indexOf(plugIn.setupAfter);
            if (setupAfterIndex !== -1) {
                this.pluginsQueue.splice(setupAfterIndex, 0, newPlugin);
            }
        }

        if (!plugIn.setupAfter && addInQueue) {
            this.pluginsQueue.push(newPlugin);
        }

        if (!this.pluginInQueue(plugIn) && addInQueue) {
            this.pluginsQueue.push(newPlugin);
        } else if (!addInQueue) {
            this.plugins.push(plugIn.name)
            const enable = plugIn.onEnable(pluginOptions);
            this.queuePromises.push(enable);
            return enable;
        }
    }

    public pluginInQueue (plugin: Plugin):boolean {
        return this.pluginsQueue.indexOf(plugin) !== -1;
    }

    public hasPlugin (pluginName:string):boolean {
        return this.plugins.indexOf(pluginName) !== -1;
    }

    public async setup ():Promise<VK> {
        if (!this.pluginsQueue.length) return this;

        let initers = [...this.pluginsQueue];
        
        initers.forEach(({plugin, options}, i) => {
            this.plugins.push(plugin.name);
            initers[i] = plugin.onEnable(options);
        });

        return Promise.all([...initers, ...this.queuePromises]).then(() => this);  
    }

    public link (propName:string, value:any):VK {
      if (this.hasOwnProperty(propName)) throw new Error('This property already exists!');
      
     
      Object.defineProperty(this, propName, {
          configurable: false,
          value
      });

      return this;   
    }
}

export default VK;
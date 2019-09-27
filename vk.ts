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

        if (plugIn.requirements) {
            for (let requiredPluginName of plugIn.requirements) {
                if (this.hasPlugin(requiredPluginName)) continue;
                let requiredPluginIndexOfQueue = this.pluginsQueue.indexOf(requiredPluginName);
                if (requiredPluginIndexOfQueue !== -1 && addInQueue) {
                    this.pluginsQueue.splice(requiredPluginIndexOfQueue, 0, {
                        plugin: plugIn,
                        options: pluginOptions
                    });
                } else if (!addInQueue && requiredPluginIndexOfQueue === -1) {
                    throw new Error(`Plugin requires a ${requiredPluginName} plugin. You should install this plugin!`);
                }
            }
        }

        if (!this.pluginInQueue(plugIn) && addInQueue) {
            this.pluginsQueue.push({
                plugin: plugIn,
                options: pluginOptions
            });
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
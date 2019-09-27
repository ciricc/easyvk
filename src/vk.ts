import { IVKOptions } from './types';
import API from './structures/api/api';
import Plugin from './structures/plugin/plugin';
import Auth from './plugins/auth';


class VK {

  /** Default options */
  public options: IVKOptions = {
    mode: 'default',
    defaults: {
      v: '5.101',
      lang: 'ru'
    },
    api: {
      domain: 'vk.com',
      protocol: 'https',
      apiSubdomain: 'api',
      oauthSubdomain: 'oauth',
      methodPath: 'method/'
    },
    auth: {
      groupsMethod: "groups.getById",
      usersMethod: "users.get",
      appsMethod: "apps.get"
    }
  };

  /** Default options which will be used in each API qeury */
  public defaultsOptions = this.options.defaults;

  /** Queue of installing plugins */
  public pluginsQueue = [];
  /** Queue of installating plugins names */
  public pluginsQueueNames = [];
  public plugins = [];
  /** Promises which already used in installation or not really */
  public queuePromises = [];

  /** API object for make API queries */
  public api = new API(this);
  

  constructor(options: IVKOptions) {
    this.setOptions(options);
    this.defaults(this.options.defaults);
    this.extend(Auth);
  }

  /**
   * Makes separate new VK options with old VK options
   * @param options New VK options
   */
  public setOptions(options: IVKOptions): VK {
    this.options = {
      ...this.options,
      ...options
    }

    return this;
  }

  /**
   * Makes separete new options with old default options
   * @param options New default options for API queries
   */
  public defaults(options: { [key: string]: any }): VK {

    this.defaultsOptions = {
      ...this.defaultsOptions,
      ...options
    }

    return this;
  }


  /**
   * Installs new plugin in main VK class library
   * Plugins are help for programmer create new features and extend the main library class
   * Also they can help support of newest updates for VK if this library will stop updating
   * 
   * @param plugin Plugin object which you want to install
   * @param pluginOptions Object options for this plugin
   * @param addInQueue If you want install plugin with others in one query, use it
   */
  public async extend(plugin: typeof Plugin, pluginOptions: { [key: string]: any } = {}, addInQueue: boolean = true) {
    let plugIn = new plugin(this, pluginOptions);

    if (!plugIn.name || plugIn.name === "defaultPlugin") throw new Error("Plugin must have unique name");
    if (this.hasPlugin(plugIn.name)) throw new Error("This plugin already installed");

    const newPlugin = {
      plugin: plugIn,
      options: pluginOptions,
      name: plugIn.name
    }

    if (plugIn.requirements) {
      for (let requiredPluginName of plugIn.requirements) {
        if (this.hasPlugin(requiredPluginName)) continue;
        if (this.pluginsQueueNames.indexOf(requiredPluginName) !== -1) continue;
        throw new Error(`Plugin requires a ${requiredPluginName} plugin. You should install this plugin!`);
      }
    }

    if (plugIn.setupAfter && addInQueue) {
      let setupAfterIndex = this.pluginsQueue.indexOf(plugIn.setupAfter);
      if (setupAfterIndex !== -1) {
        this.pluginsQueue.splice(setupAfterIndex, 0, newPlugin);
        this.pluginsQueueNames.splice(setupAfterIndex, 0, newPlugin);
      }
    }

    if (!plugIn.setupAfter && addInQueue) {
      this.pluginsQueue.push(newPlugin);
      this.pluginsQueueNames.push(newPlugin.name);
    }

    if (!this.pluginInQueue(newPlugin.plugin) && addInQueue) {
      this.pluginsQueue.push(newPlugin);
      this.pluginsQueueNames.push(newPlugin.name);
    } else if (!addInQueue) {
      this.plugins.push(plugIn.name)
      const enable = plugIn.onEnable(pluginOptions);
      this.queuePromises.push(enable);
      return enable;
    }
  }

  /**
   * Checks that this plugin waiting for installation
   * @param plugin Plugin object
   */
  public pluginInQueue(plugin: Plugin): boolean {
    return this.pluginsQueueNames.indexOf(plugin.name) !== -1;
  }

  /**
   * Checks that this plugin installed in VK class library
   * @param pluginName Plugin name
   */
  public hasPlugin(pluginName: string): boolean {
    return this.plugins.indexOf(pluginName) !== -1;
  }

  /**
   * Setting up all plugins and intializes them
   */
  public async setup(globalPluginOptions: {[key: string]: any}): Promise<VK> {
    if (!this.pluginsQueue.length) return this;

    let initers = [...this.pluginsQueue];

    initers.forEach(({ plugin, options }, i) => {
      this.plugins.push(plugin.name);
      initers[i] = plugin.onEnable({
        ...options,
        ...(globalPluginOptions[plugin.name] || {})
      });
    });

    return Promise.all([...initers, ...this.queuePromises]).then(() => this);
  }

  /**
   * Updates property value (if your plugin wants to add a link fro yourself in main VK object)
   * @param propName property value which you want to update
   * @param value value which you want to set
   */
  public link(propName: string, value: any): VK {

    if (this.linked(propName)) throw new Error(`This property already exists! (${propName}, ${this[propName]})`);

    Object.defineProperty(this, propName, {
      configurable: false,
      value
    });

    return this;
  }

  /**
   * Checks that this property already linked
   * @param propName Property name which you want check on link
   */
  public linked (propName: string):boolean {
    return this.hasOwnProperty(propName);
  }
}

export default VK;
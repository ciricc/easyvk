import Plugin from "../../structures/plugin/plugin";
import { FileStorage } from "../storage";
import * as path from 'path';
import { USER_AUTH_TYPE, GROUP_AUTH_TYPE, APP_AUTH_TYPE, IAuthOptions, Platforms, authType, IUserSession, IGroupSession, IApplicationSession } from "./types";

class Auth extends Plugin {
  public name = 'auth';
  public options:IAuthOptions = {}
  public requirements = ["storage"];
  public session:FileStorage<any>;

  /** Set wrapper */
  set (key:string, value:any) {
    
    if (key === "session") {
      return this.vk.storaget.get('auth.session').update(value);
    }

    return this[key] = value;
  }


  async onEnable (options: IAuthOptions) {
    this.options = { 
      sessionFile: path.join(__dirname, '.vksession'),
      reauth: false,
      fields: [],
      ...options 
    }
    this.initSessionStorage();
    return this.checkAuthType().then(() => this.linkIt());
  }

  /**
   * Enables session active
   */
  private initSessionStorage () {
    this.vk.storage.createStorage('auth.session', {}, this.options.sessionFile);
    this.session = this.vk.storage.get('auth.session');
  }


  /**
   * Checks authentication type on options
   */
  async checkAuthType ():Promise<any> {
    if (this.options.token) {
      return this.initTokenType().then(() => this.linkIt());
    } else if (this.options.username || this.options.password) {
      return this.initUserCredentials().then(() => this.linkIt());
    } else if (this.options.clientId || this.options.clientSecret) {

    } else {
      throw new Error('Authentication data is empty');
    }
  }

  /**
   * Making authentication user by username and password
   */
  async initUserCredentials ():Promise<any> {
    if (!this.options.username || !this.options.password) {
      throw new Error('Some of this fields not passed: password, username')
    }

    if (!this.options.reauth && this.options.username === this.session.get('username')) {
      this.vk.defaults({access_token: this.session.get('access_token')});
      return true;
    }

    if (!this.options.clientId || !this.options.clientSecret) {
      this.options = {
        ...this.options,
        clientId: Platforms.Android.client.id,
        clientSecret: Platforms.Android.client.secret
      }  
    }
    
    const extendedQuery = {
      subdomain: this.vk.options.api.oauthSubdomain,
      methodPath: 'token'
    }

    const authParams = {
      ...this.vk.defaultsOptions,
      username: this.options.username,
      password: this.options.password,
      grant_type: this.vk.options.auth.passwordGrantType,
      device_id: this.vk.options.auth.deviceId,
      libverify_support: true,
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      fields: ['first_name', 'last_name', 'photo_200', ...this.options.fields].join(',')
    }

    return this.vk.api.extendedQuery(extendedQuery, '', authParams).then(res => {
      if (res.access_token) {
        this.vk.defaults({access_token: res.access_token});
        this.createSession(USER_AUTH_TYPE as authType, {
          access_token: res.access_token,
          username: this.options.username,
          user_id: res.user_id
        });
        return true;
      }
      throw new Error('User data responsed like an empty data');
    });
  }

  /**
   * This makes authentication with access token
   */
  async initTokenType ():Promise<any> {
    const {groupsMethod, usersMethod, appsMethod} = this.vk.options.auth;
    let authMethod = usersMethod;
    
    let methodsAuthTypes = {
      [groupsMethod]: GROUP_AUTH_TYPE as authType,
      [usersMethod]: USER_AUTH_TYPE as authType,
      [appsMethod]: APP_AUTH_TYPE as authType
    }

    const session = {
      access_token: this.options.token,
      expires: 0,
    }

    // Setting new default access_token
    this.vk.defaults({
      access_token: this.options.token
    });

    // Checking authentication type if user wants this type
    if (this.options.type) {
      switch (this.options.type) {
        case GROUP_AUTH_TYPE:
          authMethod = groupsMethod;
          break;
        case USER_AUTH_TYPE:
          authMethod = usersMethod;
          break;
        case APP_AUTH_TYPE:
          authMethod = appsMethod;
          break;
        default:
          throw new Error(`Auth type is not supported (user, group, app) your type is ${this.options.type}`);
      }

      return this.vk.api.call(authMethod).then((res) => {
        if (res.length) {
          return this.createSession(methodsAuthTypes[authMethod], {
            ...session,
            ...res[0]
          });
        }
        else throw new Error(`This token not valid for this authentication type (${this.options.type})`)
      });

    } else {
      // Automatically checking all types
      return new Promise(async (resolve, reject) => {
        let methods = [groupsMethod, usersMethod, appsMethod];
        for (let method of methods) {
          let res = await this.vk.api.call(method).catch((e) => {});
          if (res && res.length) {
            this.createSession(methodsAuthTypes[method], {
              ...session,
              ...res[0]
            });
            break;
          } else if (method === methods[methods.length-1]) {
            throw new Error('This token not valid');
          }
        }
        return resolve(true);
      });
    }
  }

  /**
   * Creates session of certain authentication type
   * @param sessionType session type (user, app, group)
   * @param data session data
   */
  private createSession (sessionType:authType, data:Record<string,any>):FileStorage<any> {
    switch (sessionType) {
      case USER_AUTH_TYPE:
          this.session.update({
            first_name: data.first_name,
            last_name: data.last_name,
            photo_200: data.photo_200,
            user_id: data.user_id || data.id,
            username: data.username || '',
            access_token: data.access_token,
            expires: data.expires
          } as IUserSession);
          break;
      case GROUP_AUTH_TYPE:
          this.session.update({
            access_token: data.access_token,
            expires: data.expires,
            group_id: data.group_id || data.id,
            group_name: data.group_name || data.name,
            group_screen_name: data.group_screen || data.screen,
            photo_200: data.photo_200
          } as IGroupSession);
          break;
      case APP_AUTH_TYPE:
          this.session.update({
            app_id: data.app_id || data.id,
            app_title: data.app_title || data.title,
            app_type: data.app_type || data.type,
            app_icons: [data.icon_75, data.icon_150],
            author: {
              user_id: data.author_id
            },
            app_members_count: data.members_count || 0, 
            access_token: data.access_token,
            expires: data.expires
          } as IApplicationSession);
          break;
      default:
          throw new Error('Unknow session type wants to create!');
    }

    return this.session;
  }

  /**
   * Links auth to main library class
   */
  private linkIt ():Auth {
    if (!this.vk.linked(this.name)) this.vk.link(this.name, this);
    return this;
  }
}

export default Auth;
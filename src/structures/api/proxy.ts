const API_OBJECT_NAME = 'API Object';

/**
 * This object is used by me for create a like-a-proxy object of API
 * It can help me do no support library all time and all methods of VK API are already included here
 * 
 */
class APIProxy extends Function {
  [key: string]: any;

  constructor (optional={}) {
    super();
    return new Proxy(this, Object.keys(optional).length ? optional : this);
  }

  get (_, section:any) {
    if (typeof section !== "string") return API_OBJECT_NAME;
    if (this[section.toString()]) return this[section.toString()];

    return new APIProxy({
      get: ({}, action:any) => {
        if (typeof action !== "string") return API_OBJECT_NAME;

        let method = `${section.toString()}.${action.toString()}`;
        return new APIProxy({
          apply: (_:any, __:any, args:any) => {
            return this.call(method, ...args);
          }
        });
      },
      apply: (_:any, __:any, args:any) => {
        if (section.toString() !== "execute") throw new Error("You can no use this section as a method");
        return this.call(section.toString(), ...args);
      }
    });  
  }
  
  public call(...args:any):any {return;}
  public post (...args:any):any {return;}
}


export default APIProxy;
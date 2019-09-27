import APIProxy from "./proxy";

const axios = require('axios');



/** Method types query, i.e if you use wall .post method you should use a post method type */
type MethodType = "post" | "get";

/** Options that you should use in each API query */
interface IMethodOptions {
    v?: string | number
    lang?: string
    [key: string]: any
}

interface IQueryOptions {
    domain?: string,
    protocol?: string,
    subdomain?: string,
    methodPath?: string
}

/** 
 * This class can help you make API requests to VK API server
 * If you want use some methods, for example it can be a messages.send, you can use this object
 * 
 */


class API extends APIProxy {
    public vk;

    constructor (vk) {
      super();
      this.vk = vk;
    }

    public makeAPIQuery (url, params) {
        console.log(url, params)
        return axios.get(url, {
            params,
            responseType: 'json'
        }).then((res) => {
            return res.data.response ? res.data.response : res.data;
        }).catch(({response}) => {
            return response.data.response || {};
        });
    }

    /**
     * Makes default GET typed API request
     * @param methodName method name that you want to call (i.e messages.send)
     * @param params object options that you want to send (i.e {"peer_id": 1})
     * @param methodType method type that willbe used (i.e "post", "get", if you use wall.post you should use "post" etc)
     */
    public call (methodName: string, params?: IMethodOptions, methodType?: MethodType):any {
        return this.extendedQuery({}, methodName, params, methodType);
    }


    /**
     * Makes default POST typef API request
     * @param methodName method name that you want to call (i.e messages.send)
     * @param params object options that you want to send (i.e {"peer_id": 1})
     */
    public post (methodName: string, params?: IMethodOptions):any {
        return this.call(methodName, params, 'post');
    }

    /**
     * This method creates extended query, you can customize all parametes. Uses in Auth plugin for create auth-query
     * @param options Customization options for make other requests which waits only json data
     * @param postfixPath Is like a method name, may too a methodPath
     * @param params Query data which will send
     * @param methodType Method query (post, get)
     */
    public extendedQuery (options:IQueryOptions={}, postfixPath:string="", params?: IMethodOptions, methodType?: MethodType) {
        let api = {
            ...this.vk.options.api,
            subdomain: this.vk.options.api.apiSubdomain,
            ...options
        }
        let requestURL = `${api.protocol}://${api.subdomain}.${api.domain}/${api.methodPath}${postfixPath}`;
        return this.makeAPIQuery(requestURL, {
            ...(this.vk.defaultsOptions),
            ...params
        });
    }
}

export default API;
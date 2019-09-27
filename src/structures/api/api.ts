import APIProxy from "./proxy";

const axios = require('axios');



/** Method types query, i.e if you use wall .post method you should use a post method type */
type MethodType = "post" | "get";

/** Options that you should use in each API query */
interface IMethodOptions {
    v: string | number
    [key: string]: any
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
    
    /**
     * Makes default GET typed API request
     * @param methodName method name that you want to call (i.e messages.send)
     * @param params object options that you want to send (i.e {"peer_id": 1})
     * @param methodType method type that willbe used (i.e "post", "get", if you use wall.post you should use "post" etc)
     */
    public call (methodName: string, params?: IMethodOptions, methodType?: MethodType):any {
        const api = this.vk.options.api;
        let requestURL = `${api.protocol}://${api.apiSubdomain}.${api.domain}/${api.methodPath}${methodName}`;
        return axios.get(requestURL, {
            params: {
                ...(this.vk.defaultsOptions),
                ...params
            },
            responseType: 'json'
        }).then(res => {
            return res.data.response;
        });
    }


    /**
     * Makes default POST typef API request
     * @param methodName method name that you want to call (i.e messages.send)
     * @param params object options that you want to send (i.e {"peer_id": 1})
     */
    public post (methodName: string, params?: IMethodOptions):any {
        return this.call(methodName, params, 'post');
    }
}

export default API;
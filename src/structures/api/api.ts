import APIProxy from "./proxy";
import RequestParseException from "../../errors/RequestParseException";
import APIException from "../../errors/APIException";
import CaptchaException from "../../errors/CaptchaException";

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

  constructor(vk) {
    super();
    this.vk = vk;
  }

  public makeAPIQuery(url, params) {
    return axios.get(url, {
      params,
      responseType: 'json'
    }).then((res) => {
      return [res, res.request];
    }).catch(({ response, request }) => {
      return [response, request];
    }).then(([response, request]) => {
      return this.createResponse(response, request);
    });
  }

  private async createResponse(response, request) {
    return this.checkOnErrors(response, request).then(() => {
      return response.data;
    });
  }

  private async checkOnErrors(response, request) {
    let res = response.data;

    if (typeof res === "string") {
      throw new RequestParseException('Server responded with bad data (not a json)', {
        request,
        response
      });
    }

    if (res.error) {
      if (res.error === this.vk.options.errors.captchaError || res.error.error_code === this.vk.options.errors.captchaErrorCode) {
        // Captcha exception
        throw new CaptchaException(res.error.error_msg, {
          code: res.error.error_code,
          request,
          response,
          captchaSid: res.error.captcha_sid,
          captchaImg: res.error.captcha_img
        });

      } else if (res.error === this.vk.options.errors.validationError) {
        if (res.ban_info) {
          // User have banned
        } else {
          // User need validate account
        }
      } else if (res.error.error_code === this.vk.options.redirectErrorCode) {
        // Need redirect user
      }
    }

    let errorCode, errorMessage;
    if (res.error && res.error.message) {
      errorCode = res.error.error_code;
      errorMessage = res.error.message;
    } else if (res.error && res.error.error_msg) {
      errorCode = res.error.error_code;
      errorMessage = res.error.error_msg;
    } else if (res.error_description) {
      errorCode = res.error_code;
      errorMessage = res.error_description;
    } else {
      return false;
    }

    throw new APIException(errorMessage, {
      code: errorCode,
      request,
      response
    });
  }

  /**
   * Makes default GET typed API request
   * @param methodName method name that you want to call (i.e messages.send)
   * @param params object options that you want to send (i.e {"peer_id": 1})
   * @param methodType method type that willbe used (i.e "post", "get", if you use wall.post you should use "post" etc)
   */
  public call(methodName: string, params?: IMethodOptions, methodType?: MethodType): any {
    return this.extendedQuery({}, methodName, params, methodType);
  }


  /**
   * Makes default POST typef API request
   * @param methodName method name that you want to call (i.e messages.send)
   * @param params object options that you want to send (i.e {"peer_id": 1})
   */
  public post(methodName: string, params?: IMethodOptions): any {
    return this.call(methodName, params, 'post');
  }

  /**
   * This method creates extended query, you can customize all parametes. Uses in Auth plugin for create auth-query
   * @param options Customization options for make other requests which waits only json data
   * @param postfixPath Is like a method name, may too a methodPath
   * @param params Query data which will send
   * @param methodType Method query (post, get)
   */
  public extendedQuery(options: IQueryOptions = {}, postfixPath: string = "", params?: IMethodOptions, methodType?: MethodType) {
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
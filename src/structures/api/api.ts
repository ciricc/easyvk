import APIProxy from "./proxy";
import RequestParseException from "../../errors/RequestParseException";
import APIException from "../../errors/APIException";
import CaptchaException from "../../errors/CaptchaException";

import axios, { AxiosRequestConfig, AxiosPromise, AxiosBasicCredentials, AxiosResponse } from 'axios';
import VK from "../../vk";

/** Method types query, i.e if you use wall .post method you should use a post method type */
type methodType = "post" | "get";

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
class API extends APIProxy implements Record<string, any> {
  public vk:VK;

  constructor(vk:VK) {
    super();
    this.vk = vk;
  }

  public async withRequestConfig (request:AxiosRequestConfig):Promise<Record<string, any>> {
    return this.resolveApiRequest(axios.request(request));
  }

  private async resolveApiRequest(requestPromise:AxiosPromise):Promise<Record<string, any>> {
    return Promise.resolve(requestPromise).then((res) => {
      return [res, res.request];
    }).catch(({ response, request }) => {
      return [response, request];
    }).then(([response, request]) => {
      return this.createResponse(response, request).catch(error => {
        return this.vk.processHandlers(error.constructor, error);
      });
    });
  }

  /**
   * This is end step of creating response, only url and only data
   * @param url 
   * @param params 
   */
  public async makeAPIQuery(url:string, params:Record<string,any>, requestMethod:methodType):Promise<Record<string, any>> {
    return this.resolveApiRequest(axios.request({
      url,
      method: requestMethod,
      params,
      responseType: 'json'
    }));
  }

  /**
   * Returns a response of request or throwing exception
   * @param response response object (not body)
   * @param request request object (full)
   */
  private async createResponse(response:AxiosResponse, request:any) {
    return this.checkOnErrors(response, request).then(() => {
      return response.data.response ? response.data.response : response.data;
    });
  }

  /**
   * Checks response on having errors
   * @param response 
   * @param request 
   */
  private async checkOnErrors(response:AxiosResponse, request:any):Promise<void> {
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
          // User need validate action

        }
      } else if (res.error.error_code === this.vk.options.errors.redirectErrorCode) {
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
      return;
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
  public call(methodName: string, params?: IMethodOptions, requestMethod?: methodType):Promise<Record<string, any>> {
    return this.extendedQuery({}, methodName, params, requestMethod);
  }


  /**
   * Makes default POST typef API request
   * @param methodName method name that you want to call (i.e messages.send)
   * @param params object options that you want to send (i.e {"peer_id": 1})
   */
  public post(methodName: string, params?: IMethodOptions):Promise<Record<string, any>> {
    return this.call(methodName, params, 'post');
  }

  /**
   * This method creates extended query, you can customize all parametes. Uses in Auth plugin for create auth-query
   * @param options Customization options for make other requests which waits only json data
   * @param postfixPath Is like a method name, may too a methodPath
   * @param params Query data which will send
   * @param methodType Method query (post, get)
   */
  public extendedQuery(options: IQueryOptions = {}, postfixPath: string = "", params?: IMethodOptions, requestMethod?: methodType):Promise<Record<string, any>> {
    let api = {
      ...this.vk.options.api,
      subdomain: this.vk.options.api.apiSubdomain,
      ...options
    }
    let requestURL = `${api.protocol}://${api.subdomain}.${api.domain}/${api.methodPath}${postfixPath}`;
    return this.makeAPIQuery(requestURL, {
      ...(this.vk.defaultsOptions),
      ...params
    }, requestMethod);
  }
}

export default API;
import APIProxy from "./proxy";
import RequestParseException from "../../errors/RequestParseException";
import APIException, { IAPIExceptionData } from "../../errors/APIException";
import CaptchaException from "../../errors/CaptchaException";

import axios, { AxiosRequestConfig, AxiosPromise, AxiosBasicCredentials, AxiosResponse, Method, ResponseType } from 'axios';
import VK from "../../vk";
import { RedirectURIException } from "../../errors";
import NeedValidationException, { INeedValidationExceptionData } from "../../errors/NeedValidationException";
import TwoFactorException, { ITwoFactorExceptionData } from "../../errors/TwoFactorException";
import { IRedirectURIExceptionData } from "../../errors/RedirectURIException";
import HaveBanException, { IHaveBanExceptionData } from "../../errors/HaveBanException";
import { methodType, IMethodOptions, IQueryOptions, PREPARE_API_QUERY_CONFIG, RESOLVE_API_QUERY, ResolveApiMiddleware, IResolveApi } from "./types";
import { ComposerName } from "../../types";

/** 
 * This class can help you make API requests to VK API server
 * If you want use some methods, for example it can be a messages.send, you can use this object
 * 
 */
class API extends APIProxy implements Record<string, any> {
  public vk:VK;
  public middlewares:ComposerName[];

  constructor(vk:VK) {
    super();
    this.vk = vk;
    this.middlewares = [
      PREPARE_API_QUERY_CONFIG,
      RESOLVE_API_QUERY
    ];

    // Запускаем создание композеров для миддлаваров
    this.initComposers();
  }

  private initComposers ():this {
    /** Middleware for preapre axios config api query */
    this.vk.addComposer<AxiosRequestConfig>(PREPARE_API_QUERY_CONFIG, []);
    this.vk.addComposer<ResolveApiMiddleware>(RESOLVE_API_QUERY, []);
    return this;
  }
  // public async

  public async withRequestConfig (request:AxiosRequestConfig):Promise<Record<string, any>> {
    return this.resolveApiRequest(axios.request(request));
  }

  private async resolveApiRequest(requestPromise:AxiosPromise):Promise<Record<string, any>> {
    return Promise.resolve(requestPromise).then((res) => {
      return [res, res.request];
    }).catch(({ response, request }) => {
      return [response, request];
    }).then(async ([response, request]) => {
      
      let resolveRequestContext = {
        response: response,
        request: request
      }  as ResolveApiMiddleware;

      return this.vk.compose<ResolveApiMiddleware>(RESOLVE_API_QUERY, resolveRequestContext).then(() => (
        this.createResponse(response, request).catch(error => {
          return this.vk.processHandlers(error.constructor, error);
        })
      ));
    });
  }

  /**
   * This is end step of creating response, only url and only data
   * @param url 
   * @param params 
   */
  public async makeAPIQuery(url:string, params:Record<string,any>, requestMethod:methodType):Promise<Record<string, any>> {
    
    let queryParams = {
      url: url as string,
      method: requestMethod as Method,
      params: params as any,
      responseType: 'json' as ResponseType
    } as AxiosRequestConfig;

    await this.vk.compose<AxiosRequestConfig>(PREPARE_API_QUERY_CONFIG, queryParams);

    return this.resolveApiRequest(axios.request(queryParams));
  }

  /**
   * Returns a response of request or throwing exception
   * @param response response object (not body)
   * @param request request object (full)
   */
  public async createResponse(response:AxiosResponse, request:any) {
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
      let errorCode:number|string, errorMessage:string, errorType:number|string;

      if (res.error && res.error.message) {
        errorCode = res.error.error_code;
        errorMessage = res.error.message;
        errorType = res.error.error_type || '';
      } else if (res.error && res.error.error_msg) {
        errorCode = res.error.error_code;
        errorMessage = res.error.error_msg;
        errorType = res.error.error_type || '';
      } else if (res.error_description) {
        errorCode = res.error_code;
        errorMessage = res.error_description;
        errorType = res.error_type || '';
      }

      if (res.error && res.error_description) {
        errorCode = res.error;
        errorMessage = res.error_description;
        errorType = res.error_type || '';
      }

      let errorData = {
        code: errorCode,
        errorType,
        request,
        response
      } as IAPIExceptionData;

      if (res.error === this.vk.options.errors.captchaError || res.error.error_code === this.vk.options.errors.captchaErrorCode) {
        // Captcha exception
        throw new CaptchaException(errorMessage, {
          ...errorData,
          captchaSid: res.error.captcha_sid,
          captchaImg: res.error.captcha_img
        });

      } else if (res.error === this.vk.options.errors.validationError) {
        if (res.ban_info) {
          // User have banned
          throw new HaveBanException (errorMessage, {
            ...errorData,
            banInfo: res.ban_info,
            redirectUri: res.redirect_uri || null
          } as IHaveBanExceptionData);
        } else {
          // User need validate action
          if (res.validation_type) {
            throw new TwoFactorException(errorMessage, {
              ...errorData,
              validationType: res.validation_type,
              phoneMask: res.phone_mask || '',
              redirectUri: res.redirect_uri || '',
              validationSid: res.validation_sid || ''
            } as ITwoFactorExceptionData);
          } else {
            throw new NeedValidationException(errorMessage, errorData as INeedValidationExceptionData);
          }
        }
      } else if (res.error.error_code === this.vk.options.errors.redirectErrorCode) {
        // Need redirect user
        throw new RedirectURIException(errorMessage, {
          ...errorData,
          redirectUri: res.redirect_uri
        } as IRedirectURIExceptionData);
      }

      throw new APIException(errorMessage, errorData);
    }

    return;
  }

  /**
   * Makes default GET typed API request
   * @param methodName method name that you want to call (i.e messages.send)
   * @param params object options that you want to send (i.e {"peer_id": 1})
   * @param methodType method type that willbe used (i.e "post", "get", if you use wall.post you should use "post" etc)
   */
  public async call(methodName: string, params?: IMethodOptions, requestMethod?: methodType):Promise<Record<string, any>> {
    return this.extendedQuery({}, methodName, params, requestMethod);
  }


  /**
   * Makes default POST typef API request
   * @param methodName method name that you want to call (i.e messages.send)
   * @param params object options that you want to send (i.e {"peer_id": 1})
   */
  public async post(methodName: string, params?: IMethodOptions):Promise<Record<string, any>> {
    return this.call(methodName, params, 'post');
  }

  /**
   * This method creates extended query, you can customize all parametes. Uses in Auth plugin for create auth-query
   * @param options Customization options for make other requests which waits only json data
   * @param postfixPath Is like a method name, may too a methodPath
   * @param params Query data which will send
   * @param methodType Method query (post, get)
   */
  public async extendedQuery(options: IQueryOptions = {}, postfixPath: string = "", params?: IMethodOptions, requestMethod?: methodType):Promise<Record<string, any>> {
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
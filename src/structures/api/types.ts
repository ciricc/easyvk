import { Middleware } from "middleware-io";
import { AxiosRequestConfig, AxiosResponse } from "axios";

/** Method types query, i.e if you use wall .post method you should use a post method type */
export type methodType = "post" | "get";

/** Middleware for api query preparing */
export const PREPARE_API_QUERY_CONFIG = 'api.prepareApiConfig';
/** Middleware for api resolving query */
export const RESOLVE_API_QUERY = 'api.resolveApiQuery';

/** Options that you should use in each API query */
export interface IMethodOptions {
  v?: string | number
  lang?: string
  [key: string]: any
}

export interface IQueryOptions {
  domain?: string,
  protocol?: string,
  subdomain?: string,
  methodPath?: string
}

export interface IResolveApi {
  request: any,
  response: AxiosResponse
}

export type ResolveApiMiddleware = IResolveApi

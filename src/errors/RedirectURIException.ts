import { APIException } from ".";
import { IAPIExceptionData } from "./APIException";
import NeedValidationException, { INeedValidationExceptionData } from "./NeedValidationException";

export interface IRedirectURIExceptionData extends IAPIExceptionData {
  /** Identificator for redirect */
  redirectUri:string
}

/**
 * Fires when user need validate action by redirect_uri property
 */
class RedirectURIException extends NeedValidationException implements IRedirectURIExceptionData {
  public redirectUri:string;
  constructor (message:any, error:IRedirectURIExceptionData) {
    super(message, error);
    this.redirectUri = error.redirectUri;
    Error.captureStackTrace(this, RedirectURIException);
  }
}

export default RedirectURIException;
import NeedValidationException, { INeedValidationExceptionData } from "./NeedValidationException";


export interface ITwoFactorExceptionData extends INeedValidationExceptionData {
  /** Validation type two factor authentication */
  validationType: '2fa_sms' | '2fa_app'
  /** Validation seed */
  validationSid?:string
  /** Phone mask */
  phoneMask?:string
  /** Redirect URI for validate account */
  redirectUri?:string
}

/**
 * Fires when user tries authenticate but he need two factor verify account
 */
class TwoFactorException extends NeedValidationException implements ITwoFactorExceptionData {
  public validationType; 
  public validationSid;
  public phoneMask;
  public redirectUri;

  constructor (message:string, error:ITwoFactorExceptionData) {
    super(message, error);
    
    this.validationType = error.validationType;
    this.phoneMask = error.phoneMask;
    this.validationSid = error.validationSid;
    this.redirectUri = error.redirectUri;

    Error.captureStackTrace(this, TwoFactorException);
  }
}


export default TwoFactorException;
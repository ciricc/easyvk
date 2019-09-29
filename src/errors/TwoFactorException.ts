import NeedValidationException, { INeedValidationExceptionData } from "./NeedValidationException";


export interface ITwoFactorExceptionData extends INeedValidationExceptionData {
  /** Validation type two factor authentication */
  validationType: '2fa_sms' | '2fa_app'
}

/**
 * Fires when user tries authenticate but he need two factor verify account
 */
class TwoFactorException extends NeedValidationException implements ITwoFactorExceptionData {
  public validationType;
  
  constructor (message:string, error:ITwoFactorExceptionData) {
    super(message, error);
    this.validationType = error.validationType;
    Error.captureStackTrace(this, TwoFactorException);
  }
}


export default TwoFactorException;
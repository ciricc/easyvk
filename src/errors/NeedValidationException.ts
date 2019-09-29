import APIException from "./APIException";
import { IAPIExceptionData } from "./APIException";

export interface INeedValidationExceptionData extends IAPIExceptionData {
  /** If user have been b */
  code: 'need_validation'
}

/** Validation error wrapper */
class NeedValidationException extends APIException implements INeedValidationExceptionData {
  constructor (message, error:IAPIExceptionData) {
    error.code = 'need_validation';
    super(message, error);
    Error.captureStackTrace(this, NeedValidationException);
  }
}


export default NeedValidationException;
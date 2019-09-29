export interface IAPIExceptionData {
  /** Error code */
  code: number|string
  /** error_type field which uses in error identification */
  errorType?:string
  /** request which sended when occured this error */
  request?: {[key:string]:any}
  /** Response whuch got when occured this error */
  response?: any,
  /** Any options */
  [key:string]: any
}

/** 
 * APIExceptions is an exception which occurs when API server responded with error (true error, not a bad request 403)
 * 
 */
class APIException extends Error {
  public code;
  public message;
  public request;
  public response;
  public errorType;

  constructor (message, {request, response, code, errorType}:IAPIExceptionData) {
    super(message);
    
    this.request = request;
    this.response = response;
    this.code = code;
    this.errorType = errorType;

    Error.captureStackTrace(this, APIException);
  }

  [Symbol("toString")] () {
    return `(${this.name} error): ${this.message}`
  }
 }

export default APIException;
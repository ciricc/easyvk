export interface IAPIExceptionData {
  /** Error code */
  code: number|string
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

  constructor (message, {request, response, code}:IAPIExceptionData) {
    super(message);
    
    this.request = request;
    this.response = response;
    this.code = code;

    Error.captureStackTrace(this, APIException);
  }

  [Symbol("toString")] () {
    return `(${this.name} error): ${this.message}`
  }
 }

export default APIException;
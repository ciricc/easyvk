interface IRequestParseExceptionData {
    /** Query which sended when occured this error */
    request?: {[key:string]:any}
    /** Response whuch got when occured this error */
    response?: any
}

/** 
 * APIExceptions is an exception which occurs when API server responded with error (true error, not a bad request 403)
 * 
 */
class RequestParseException extends Error {
    public code;
    public message;
    public request;
    public response;

    constructor (message, {request, response}:IRequestParseExceptionData) {
        super(message);
        
        this.request = request;
        this.response = response;
        this.code = "RequestParseException";

        Error.captureStackTrace(this, RequestParseException);
    }
}

export default RequestParseException;
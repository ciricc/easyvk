import APIException from "./APIException";
import { IAPIExceptionData } from './APIException';

interface ICaptchaExceptionData extends IAPIExceptionData {
  /** Captcha's id */
  captchaSid:number,
  /** Url to captcha image */
  captchaImg:string
}

class CaptchaException extends APIException {
  
  public captchaSid:number;
  public captchaImg:string;

  constructor (message, error:ICaptchaExceptionData) {
    super(message, error);
    
    this.captchaSid = error.captchaSid;
    this.captchaImg = error.captchaImg;

    Error.captureStackTrace(this, CaptchaException);
  }
}

export default CaptchaException;
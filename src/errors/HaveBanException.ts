import { IAPIExceptionData} from "./APIException";
import APIException from './APIException';

export interface IHaveBanExceptionData extends  IAPIExceptionData {
  /** What do you need to do to keep registered account */
  redirectUri?:string
  /** Information about banned account */
  banInfo?:Record<string, any>
}

/**
 * Fires when user tries authenticate, but got a "have ban" message
 */
class HaveBanException extends APIException implements IHaveBanExceptionData {
  public redirectUri:string;
  public banInfo:Record<string, any>;

  constructor(message:string, error:IAPIExceptionData) {
    super(message, error);
    this.redirectUri = error.redirectUri;
    this.banInfo = error.banInfo;
  }
}

export default HaveBanException;
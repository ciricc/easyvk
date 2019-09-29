class UnknowErrorException extends Error {
  constructor (message:string = 'Unknow error. Server responed without error and without a JSON response ...') {
    super(message);
    Error.captureStackTrace(this, UnknowErrorException);
  } 
}

export default UnknowErrorException;
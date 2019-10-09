/** Group authentication way */
export const GROUP_AUTH_TYPE = "group";
/** User authentication way */
export const USER_AUTH_TYPE = "user";
/** Application authentication way */
export const APP_AUTH_TYPE = "app";

/** Type of supported platforms for authenticate user */
export const Platforms = {
  Android: {
    client: {
      id: 2274003,
      secret: "hHbZxrka2uZ6jB1inYsH"  
    },
    name: "ANDROID"
  },
  IOS: {
    client: {
      id: 3140623,
      secret: "VeWdmVclDCtn6ihuP1nt"
    },
    name: "IOS"
  },
  Windows: {
    client: {
      id: 3697615,
      secret: "AlVXZFMUqyrnABp8ncuU"
    },
    name: "Windows Client"
  }
}

export type authType = "group" | "user" | "app";

export interface IAuthOptions {
  /** Accesss token for requests (group, user, app) */
  token?:string
  /** Auth type which will be used for get data for session */
  type?: authType
  /** Username on vk.com */
  username?:string|number
  /** Password */
  password?:string
  /** Applications id which will be used for authenticate user */
  clientId?:string|number
  /** Application secret which will be used for authenticate user */
  clientSecret?:string
  /** Need get storage data from session or use new auth data (only for username and password) */
  reauth?:boolean
  /** A session storage destinetion path to file */
  sessionFile?:string
  /** Fields which will got from API auth request */
  fields?:string[]
}

export interface ISesssion {
  access_token:string
  expires:number
  fields?:Record<string, any>
}

export interface IUserSession extends ISesssion {
  user_id:number
  first_name:string
  last_name:string
  photo_200:string
  username?:string
}

export interface IGroupSession extends ISesssion {
  group_id:number
  group_name:string
  photo_200:string
  group_screen_name?:string
}

export interface IApplicationSession extends ISesssion {
  app_id: number
  app_title:string
  app_type:string
  app_icons?:string[]
  author?: {
    user_id:number
  }
  app_members_count?:number
}
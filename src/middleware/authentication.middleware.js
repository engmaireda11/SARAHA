import { TokenTypeEnum } from "../common/enum/index.js";
import {
  ForbiddenException,
  UnothorizeException,
} from "../common/expceptions/error.exception.js";
import { basicAuth, decodeToken } from "../common/security/index.js";

export const bearerAuth = async ({req, tokenType = TokenTypeEnum.ACCESS}={}) => {
  const [key, credentail] = req.headers['authorization'].split(" ") || [];
  const { user, payload } = await decodeToken({
    authorization: credentail,
    tokenType,
  });
  req.user = user;
  req.payload = payload;
};

export const authentication = (tokenType = TokenTypeEnum.ACCESS) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw UnothorizeException("Unothorized Account");
    }

    const [key, credentail] = authorization.split(" ") || [];
    console.log({ key, credentail });
    switch (key) {
      case "Basic":
        const [email, password] = Buffer.from(credentail, "base64")
          .toString()
          .split(":");
        req.user = await basicAuth({ email, password });
        break;
      case "Bearer":
       await bearerAuth({req,tokenType})
        break;
      default:
        throw new Error("Invalid Authentication Schema", {
          cause: { status: 400 },
        });

        break;
    }

    next();
  };
};

export const authrization = (accessRole) => {
  return async (req, res, next) => {
    if (req.user.role < accessRole) {
      throw ForbiddenException("Forbidden Account");
    }

    next();
  };
};

// export const authrization = (accessRoles) => {
//   return async (req, res, next) => {
//   if(!accessRoles.includes(req.user.role)){
//     throw ForbiddenException("Forbidden Account")
//   }

//     next();
//   };
// }

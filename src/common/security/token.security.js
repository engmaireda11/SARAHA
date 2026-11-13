import jwt from "jsonwebtoken";
import {
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_USER_TOKEN_SIGNATURE,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_USER_TOKEN_SIGNATURE,
} from "../../config.js";
import {
  BadRequestException,
  NotfoundException,
  UnothorizeException,
} from "../expceptions/error.exception.js";
import { findById, findOne, findOneAndDelete } from "../repository/base.repository.js";
import { UserModel } from "../../db/models/index.js";
import { HashingApproachEnum, TokenTypeEnum } from "../enum/index.js";
import { RoleEnum } from "../enum/index.js";
import { compare } from "./hash.security.js";
import { randomUUID } from "crypto";
import { exist, set } from "../services/index.js";


export const userBaseKey =({userId})=>{
  return `User::${userId.toString()}`
}
export const userBaseRevokeTokenKey =({userId})=>{
  return `${userBaseKey({userId})}::Revoke_Token`
}
export const userRevokeTokenKey =({userId,jti})=>{
  return `${userBaseRevokeTokenKey({userId})}::${jti}`
}

export const createToken = ({
  payload = {},
  options = {},
  secret = ACCESS_USER_TOKEN_SIGNATURE,
}) => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = ({
  token = "",

  secret = ACCESS_USER_TOKEN_SIGNATURE,
}) => {
  return jwt.verify(token, secret);
};

const getTokenSignature = async ({ role = RoleEnum.USER } = {}) => {
  let signatures;

  switch (role) {
    case RoleEnum.USER:
      signatures = {
        accessSignature: ACCESS_USER_TOKEN_SIGNATURE,
        refreshSignature: REFRESH_USER_TOKEN_SIGNATURE,
      };
      break;
    case RoleEnum.ADMIN:
      signatures = {
        accessSignature: ACCESS_ADMIN_TOKEN_SIGNATURE,
        refreshSignature: REFRESH_ADMIN_TOKEN_SIGNATURE,
      };
      break;
  }
  return signatures;
};

const getSignature = async ({
  tokenType = TokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const signaturs = await getTokenSignature({ role });
  return tokenType == TokenTypeEnum.ACCESS
    ? signaturs.accessSignature
    : signaturs.refreshSignature;
};

export const decodeToken = async ({
  authorization = "",
  tokenType = TokenTypeEnum.ACCESS,
} = {}) => {
  //console.log({ token: authorization });

  const decoded = jwt.decode(authorization);
  if (!decoded.aud?.length) {
    throw BadRequestException("Missing Token Payload");
  }

  const payload = verifyToken({
    token: authorization,
    secret: await getSignature({ tokenType, role: decoded.aud[0] }),
  });
  if (!payload?.sub) {
    throw BadRequestException("Missing Token Payload");
  }
  if(await exist({key:userRevokeTokenKey({userId:payload.sub,jti:payload.jti})})){
    throw UnothorizeException("Expired login Credentails")
  }
  const user = await findById({ model: UserModel, id: payload.sub });

  if (!user) {
    throw NotfoundException("Invaild user Id");
  }

  if((user.changeCredentailsTime?.getTime()??0) >payload.iat *1000 ){
     throw UnothorizeException("Expired login Credentails")
  }

  return { user, payload };
};

export const createLoginCredentails = async ({
  user,
  issuer,
  options = {},
}) => {
  const { accessSignature, refreshSignature } = await getTokenSignature({
    role: user.role,
  });
const jwtid =randomUUID()

  const accessToken = createToken({
    payload: { sub: user._id },
    secret: accessSignature,
    options: {
      ...options,
      issuer,
      audience: [user.role],
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      jwtid
    },
  });
  const refreshToken = createToken({
    payload: { sub: user._id },

    options: {
      ...options,
      issuer,
      audience: [user.role],
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      jwtid
    },
    secret: refreshSignature,
  });
  console.log({ accessSignature, refreshSignature });

  return { accessToken, refreshToken };
};

export const createRevokeToken = async({payload})=>{
   const consumedTime = (Math.ceil(Date.now() / 1000) - payload.iat);
  const refreshExpiresIn = payload.iat + REFRESH_TOKEN_EXPIRES_IN;
  const ttl = refreshExpiresIn - consumedTime;
  await set({
    key: userRevokeTokenKey({userId:payload.sub,jti:payload.jti}),
    value: payload.jti,
    ttl,
  });
  return;
}

export const basicAuth = async ({ email, password }) => {
  const user = await findOne({
    model: UserModel,
    filter: { email },
  });
  if (!user) {
    throw NotfoundException("not Exists");
  }

  const match = await compare(
    password,
    user.password,
    HashingApproachEnum.ARGON2,
  );
  //console.log({ FE_PASSWRD: password, hash: user.password, match });

  if (!match) {
    throw NotfoundException("not Exists");
  }
  return user
};

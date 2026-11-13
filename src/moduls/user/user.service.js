import jwt from "jsonwebtoken";
import { findById, findByIdAndUpdate } from "../../common/repository/base.repository.js";
import { UserModel } from "../../db/models/index.js";
import {
  createLoginCredentails,
  createRevokeToken,
  userBaseRevokeTokenKey,
  userRevokeTokenKey,
  verifyToken,
} from "../../common/security/index.js";
import {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
} from "../../config.js";
import {
  BadRequestException,
  ConflictException,
} from "../../common/expceptions/error.exception.js";
import { del, keys, set } from "../../common/services/index.js";
import {
  EmailSubjectEnum,
  LogoutEnum,
  ProviderEnum,
} from "../../common/enum/index.js";
import {
  sendEmailOtp,
  verifyEmailOtp,
} from "../authentication/authentication.service.js";

export const profile = async (account) => {
  return account;
};

// only these fields can be changed through PATCH /user
// (role, password, email, provider, twoStepVerification... are NOT editable here)
const UPDATABLE_FIELDS = ["firstname", "lastname", "phone", "DOB", "gender"];

export const update = async (user, data = {}) => {
  const safeData = Object.fromEntries(
    Object.entries(data).filter(([key]) => UPDATABLE_FIELDS.includes(key)),
  );
  const account = await findByIdAndUpdate({
    id: user._id,
    model: UserModel,
    update: safeData,
  });
  return account;
};

const assertCanUseTwoStepVerification = (user) => {
  if (user.provider !== ProviderEnum.SYSTEM) {
    throw BadRequestException(
      "2-step verification is only available for accounts that log in with email and password",
    );
  }
  if (user.twoStepVerification) {
    throw ConflictException("2-step verification is already enabled");
  }
};

// step 1: logged in user asks to enable 2-step verification => OTP is sent to his email
export const requestEnableTwoStepVerification = async (user) => {
  assertCanUseTwoStepVerification(user);
  await sendEmailOtp({
    email: user.email,
    subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
  });
  return;
};

// step 2: user sends the OTP => 2-step verification is enabled
export const confirmEnableTwoStepVerification = async (user, { otp }) => {
  assertCanUseTwoStepVerification(user);
  await verifyEmailOtp({
    email: user.email,
    otp,
    subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
  });
  user.twoStepVerification = true;
  await user.save();
  return;
};

export const rotateToken = async (payload, user, issuer) => {
  const accessExpirsIn = (payload.iat + ACCESS_TOKEN_EXPIRES_IN) * 1000;
  const currentTime = Date.now() + 5 * 60000;
  if (currentTime < accessExpirsIn) {
    throw ConflictException(
      "sorry we cannot create login credentials while current access token still within time range ",
    );
  }

  const data= await createLoginCredentails({ user, issuer });
  await createRevokeToken({payload})
  return data
};

export const logout = async (payload, user,{action=LogoutEnum.DEVICE}) => {

    switch (action) {
        case LogoutEnum.ALL:
            user.changeCredentailsTime = Date.now()
            await user.save()
            await del({key:await keys({prefix:userBaseRevokeTokenKey({userId:payload.sub})})})
            break;
    
        default:
             await createRevokeToken({payload})
            break;
    }
 return
};

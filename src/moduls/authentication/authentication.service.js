import {
  EmailSubjectEnum,
  HashingApproachEnum,
  ProviderEnum,
} from "../../common/enum/index.js";
import {
  BadRequestException,
  ConflictException,
  NotfoundException,
  TwoManyRequstException,
} from "../../common/expceptions/error.exception.js";
import { create, createOne, findOne } from "../../common/repository/base.repository.js";
import {
  assertLoginNotBanned,
  clearFailedLogins,
  registerFailedLogin,
  compare,
  createLoginCredentails,
  createToken,
  decryption,
  hash,
  userBaseRevokeTokenKey,
} from "../../common/security/index.js";

import { UserModel } from "../../db/models/index.js";
import bcrypt from "bcrypt";
import { encryotion } from "./../../common/security/index.js";
import jwt from "jsonwebtoken";
import { WEB_CLIENT_IDS } from "../../config.js";
import { OAuth2Client } from "google-auth-library";
import {
  createOTP,
  eventEmail,
  sendEmail,
  UserEmailKey,
  UserEmailTrailsKey,
} from "../../common/utils/index.js";
import {
  del,
  expire,
  get,
  incrBy,
  keys,
  set,
  ttl,
} from "../../common/services/index.js";
import { promise } from "zod";

/*
 payload: {
    iss: 'https://accounts.google.com',
    azp: '868805329485-s6gum0q5l9ii542u3lat201l55eb8trc.apps.googleusercontent.com',
    aud: '868805329485-s6gum0q5l9ii542u3lat201l55eb8trc.apps.googleusercontent.com',
    sub: '103718233647355877789',
    email: 'maireda017@gmail.com',
    email_verified: true,
    nonce: 'not_provided',
    nbf: 1793898209,
    name: 'Mai Reda',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocJpoSCTh__m-fa_ympEhm_chcfADHj893-1-udM4b_hI7ydyQ=s96-c',
    given_name: 'Mai',
    family_name: 'Reda',
    iat: 1793898509,
    exp: 1793902109,
    jti: '073f2031dd5917d3fc1982a53458e27c4f99b1fa'
  }
*/
const client = new OAuth2Client();
async function verifyGoogleAccount(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_IDS,
  });
  const payload = ticket.getPayload();
  if (!payload.email_verified) {
    throw BadRequestException("Email is not verified");
  }
  return payload;
}

export const sendEmailOtp = async ({
  email,
  subject,
  expirsIn = 120,
  maxTrials = 15,
  blockInSeconds = 300,
  title,
}) => {
  const existsOTP_TTL = await ttl({ key: UserEmailKey({ email, subject }) });
  if (existsOTP_TTL > 0) {
    throw ConflictException(
      `Sorry we cannot create otp while exists one still valid please try agin later after ${existsOTP_TTL}s`,
    );
  }
  const olddTrails =
    (await get({ key: UserEmailTrailsKey({ email, subject }) })) ?? 0;
  if (olddTrails >= maxTrials) {
    throw TwoManyRequstException("max otp trails has been reached");
  }

  const code = createOTP();
  await set({
    key: UserEmailKey({
      email,
      subject,
    }),
    value: await hash({
      plainText: code.toString(),
    }),
    ttl: expirsIn,
  });

  const currentTrails = await incrBy({
    key: UserEmailTrailsKey({ email, subject }),
  });
  if (currentTrails === 3) {
    await expire({
      key: UserEmailTrailsKey({ email, subject }),
      ttl: blockInSeconds,
    });
  }

  eventEmail.emit("sendEmail", {
    recipients: { to: email },
    subject,
    data: { code: code, title: title ?? subject },
  });
};

export const verifyEmailOtp = async ({
  email,
  otp,
  subject,
  maxFailedAttempts = 5,
}) => {
  const otpKey = UserEmailKey({ email, subject });
  const failedKey = `${otpKey}::Failed`;

  const hashOtp = await get({ key: otpKey });
  if (!hashOtp) {
    throw BadRequestException("Invaild OTP");
  }

  if (!(await compare(otp, hashOtp))) {
    const failed = await incrBy({ key: failedKey });
    if (failed === 1) {
      const remaining = await ttl({ key: otpKey });
      if (remaining > 0) await expire({ key: failedKey, ttl: remaining });
    }
    if (failed >= maxFailedAttempts) {
      await del({ key: [otpKey, failedKey] });
      throw BadRequestException(
        "Too many invalid attempts, please request a new code",
      );
    }
    throw BadRequestException("Invaild OTP");
  }

  await del({ key: await keys({ prefix: otpKey }) });
};

export const signup = async ({ email, password, username, phone }) => {
  // console.log({ email, password, username });

  const duplicatesAccount = await findOne({
    model: UserModel,
    filter: { email },
    options: { select: "email" },
  });
  if (duplicatesAccount) {
    throw ConflictException("Email Exists");
  }

  const account = await create({
    data: [
      {
        email,
        password: await hash({
          plainText: password,
          approach: HashingApproachEnum.ARGON2,
        }),
        username,
        phone: await encryotion(phone),
      },
    ],
    model: UserModel,
  });

  await sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL });

  return account;
};

export const login = async ({ email, password }, issuer) => {
  // 5 consecutive wrong passwords => 5 minutes ban
  await assertLoginNotBanned({ email });

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
  });
  if (!account) {
    await registerFailedLogin({ email });
    throw NotfoundException("not Exists");
  }

  const match = await compare(
    password,
    account.password,
    HashingApproachEnum.ARGON2,
  );

  if (!match) {
    await registerFailedLogin({ email });
    throw NotfoundException("not Exists");
  }

  await clearFailedLogins({ email });

  // 2-step verification enabled: send OTP, tokens are issued by confirmLogin
  if (account.twoStepVerification) {
    await sendEmailOtp({
      email,
      subject: EmailSubjectEnum.LOGIN_CONFIRMATION,
    });
    return { requiresTwoStepVerification: true };
  }

  return await createLoginCredentails({ user: account, issuer });
};

export const confirmLogin = async ({ email, otp }, issuer) => {
  await assertLoginNotBanned({ email });

  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
      twoStepVerification: true,
    },
  });
  if (!account) {
    throw NotfoundException("Failed to find User Account");
  }

  await verifyEmailOtp({
    email,
    otp,
    subject: EmailSubjectEnum.LOGIN_CONFIRMATION,
  });

  return await createLoginCredentails({ user: account, issuer });
};

export const loginWithGmail = async (account, issuer) => {
  return await createLoginCredentails({ user: account, issuer });
};

export const signupWithGmail = async ({ idToken }, issuer) => {
  console.log({ idToken });
  const { name, email, picture } = await verifyGoogleAccount(idToken);
  console.log({ name, email, picture });

  const existAccount = await findOne({
    model: UserModel,
    filter: {
      email,
    },
  });

  if (existAccount) {
    if (existAccount.provider != ProviderEnum.GOOGLE) {
      throw ConflictException("Invaild Account Provider");
    }

    return {
      status: 200,
      data: await createLoginCredentails({ user: existAccount, issuer }),
    };
  }
  const user = await createOne({
    model: UserModel,
    data: {
      username: name,
      email,
      confirmEmail: new Date(),
      provider: ProviderEnum.GOOGLE,
      image: picture,
    },
  });

  return { status: 201, data: await createLoginCredentails({ user, issuer }) };
};

export const confirmEmail = async ({ otp, email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
    options: { select: "email" },
  });
  if (!account) {
    throw NotfoundException("Failed to find User Account");
  }

  const hashOtp = await get({
    key: UserEmailKey({
      email: email,
      subject: EmailSubjectEnum.CONFIRM_EMAIL,
    }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    throw BadRequestException("Invaild OTP");
  }

  account.confirmEmail = new Date();
  await account.save();
  await del({
    key: await keys({
      prefix: UserEmailKey({
        email: email,
        subject: EmailSubjectEnum.CONFIRM_EMAIL,
      }),
    }),
  });

  return;
};
export const resendConfirmEmail = async ({ email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: false },
    },
    options: { select: "email" },
  });
  if (!account) {
    throw NotfoundException("Failed to find User Account");
  }

  await sendEmailOtp({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL });

  return;
};
export const requestForgotPasswordCode = async ({ email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
    options: { select: "email" },
  });
  if (!account) {
    throw NotfoundException("Failed to find User Account");
  }

  await sendEmailOtp({ email, subject: EmailSubjectEnum.FORGET_PASSWORD });

  return;
};

export const verifyForgotPasswordCode = async ({ otp, email }) => {
  const account = await findOne({
    model: UserModel,
    filter: {
      email,
      provider: ProviderEnum.SYSTEM,
      confirmEmail: { $exists: true },
    },
    options: { select: "email" },
  });
  if (!account) {
    throw NotfoundException("Failed to find User Account");
  }

  const hashOtp = await get({
    key: UserEmailKey({
      email: email,
      subject: EmailSubjectEnum.FORGET_PASSWORD,
    }),
  });

  if (!hashOtp || !(await compare(otp, hashOtp))) {
    throw BadRequestException("Invaild OTP");
  }

  return account;
};

export const resetForgotPassword = async ({ otp, email, password }) => {
  const account = await verifyForgotPasswordCode({ otp, email });
  account.password =await hash({plainText:password, approach: HashingApproachEnum.ARGON2});
  account.changeCredentialsTime = new Date();
  await account.save();

  const result = await Promise.all(
 [   keys({
      prefix: userBaseRevokeTokenKey({ userId: account._id }),
    }),
    keys({
      prefix: UserEmailKey({
        email: email,
        subject: EmailSubjectEnum.FORGET_PASSWORD,
      }),
    }),]
  );

  await del({
    key: [...result[0], ...result[1]],
  });

  return;
};

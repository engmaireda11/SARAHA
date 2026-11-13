import { TwoManyRequstException } from "../expceptions/error.exception.js";
import { del, expire, incrBy, set, ttl } from "../services/index.js";

export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const LOGIN_BAN_SECONDS = 5 * 60;
// consecutive failures are counted inside this window, a successful login resets them
const FAILED_ATTEMPTS_WINDOW_SECONDS = 15 * 60;

export const loginFailedAttemptsKey = ({ email }) =>
  `User::${email}::Login_Failed_Attempts`;
export const loginBanKey = ({ email }) => `User::${email}::Login_Ban`;

const banMessage = (seconds) =>
  `Too many failed login attempts, account is temporarily banned. Please try again after ${seconds}s`;

export const assertLoginNotBanned = async ({ email }) => {
  const remaining = await ttl({ key: loginBanKey({ email }) });
  if (remaining > 0) {
    throw TwoManyRequstException(banMessage(remaining));
  }
};

export const registerFailedLogin = async ({ email }) => {
  const failedKey = loginFailedAttemptsKey({ email });
  const attempts = await incrBy({ key: failedKey });
  if (attempts === 1) {
    await expire({ key: failedKey, ttl: FAILED_ATTEMPTS_WINDOW_SECONDS });
  }

  if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
    await set({ key: loginBanKey({ email }), value: "banned", ttl: LOGIN_BAN_SECONDS });
    // start from zero once the ban is over
    await del({ key: failedKey });
    throw TwoManyRequstException(banMessage(LOGIN_BAN_SECONDS));
  }
};

export const clearFailedLogins = async ({ email }) => {
  await del({ key: loginFailedAttemptsKey({ email }) });
};

export const ApplicationException = ({
  message = "error",
  options = {
    cause: { satus: 400 },
  },
} = {}) => {
  throw new Error(message, options);
};

export const ConflictException = (message = "Conflict", issues ) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 409, issues },
    },
  });
};
export const TwoManyRequstException = (message = "Two Many Requst ", issues ) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 429, issues },
    },
  });
};

export const NotfoundException = (message = "Notfound", issues ) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 404, issues },
    },
  }
  );
};
export const UnothorizeException = (message = "Unothorize", issues ) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 401, issues },
    },
  }
  );
};
export const ForbiddenException = (message = "Forbidden", issues ) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 403, issues },
    },
  }
  );
};
export const BadRequestException = (message = "BadRequest", issues ) => {
  return ApplicationException({
    message,
    options: {
      cause: { status: 400, issues },
    },
  }
  );
};

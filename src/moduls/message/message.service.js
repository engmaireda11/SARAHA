import { NotfoundException } from "../../common/expceptions/error.exception.js";
import {
  createOne,
  deleteOne,
  findOne,
  paginate,
} from "../../common/repository/message.repository.js";
import { find as baseFind } from "../../common/repository/base.repository.js";
import { RequestStatusEnum } from "../../common/enum/index.js";
import { RequestModel } from "../../db/models/index.js";

import { findById as findUserById } from "../../common/repository/user.repository.js";

export const createMessage = async (
  { content, receiverId } = {},
  files = [],
  user = undefined,
) => {
  const checkUserExist = await findUserById({
  
    id: receiverId,
  });

  if (!checkUserExist) {
    throw NotfoundException("Invaild Recevier Id");
  }

  const message = await createOne({
    data: {
      receiverId,
      content,
      attachments: files.map((ele) => ele.path),
      ...(user ? { senderId: user._id } : {}),
    },
  });

  // the sender may know who he wrote to, nothing else leaves here
  return message;
};

// The receiver must NOT see who sent the message, unless the sender accepted
// an identity request for that message. For received messages we also expose
// the status of the identity request (null when no request was made).
const applySenderPrivacy = async (docs = [], user) => {
  const userId = user._id.toString();
  const received = docs.filter(
    (doc) => doc.receiverId?.toString() === userId && doc.senderId,
  );

  const requests = received.length
    ? await baseFind({
        model: RequestModel,
        filter: { messageId: { $in: received.map((doc) => doc._id) } },
        options: { select: "messageId status", lean: true },
      })
    : [];
  const statusByMessage = new Map(
    requests.map((request) => [request.messageId.toString(), request.status]),
  );

  return docs.map((doc) => {
    const message = doc.toObject();
    if (message.receiverId?.toString() === userId) {
      const status = statusByMessage.get(message._id.toString());
      message.identityRequestStatus = status ?? null;
      if (status !== RequestStatusEnum.ACCEPTED) {
        delete message.senderId;
      }
    }
    return message;
  });
};

export const getAllMessage = async (
  { type, page, limit } = {},
  user = undefined,
) => {
  let filter = {};
  if (type == "0") {
    filter = { receiverId: user._id };
  } else if (type == "1") {
    filter = { senderId: user._id };
  } else {
    filter = {
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    };
  }

  const data = await paginate({
    filter,
    options: {
      sort: { createdAt: -1 },
    },
    limit,
    page,
  });
  data.docs = await applySenderPrivacy(data.docs, user);
  return data;
};

export const deleteMessage = async ({ messageId }, user) => {
  const data = await deleteOne({
    filter: { receiverId: user._id, _id: messageId },
  });
  if (!data.deletedCount) {
    throw NotfoundException("Inavaild Message Id");
  }
  return data;
};
export const getMessage = async ({ messageId }, user) => {
  const data = await findOne({
    filter: { receiverId: user._id, _id: messageId },
  });
  if (!data) {
    throw NotfoundException("Inavaild Message Id");
  }
  const [message] = await applySenderPrivacy([data], user);
  return message;
};

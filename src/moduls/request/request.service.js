import {
  BadRequestException,
  ConflictException,
  NotfoundException,
} from "../../common/expceptions/error.exception.js";
import {
  createOne,
  findOne,
  findOneAndUpdate,
  paginate,
} from "../../common/repository/base.repository.js";
import { RequestStatusEnum } from "../../common/enum/index.js";
import {
  ConversationModel,
  MessageModel,
  RequestModel,
} from "../../db/models/index.js";


export const createRequest = async ({ messageId }, user) => {
  const message = await findOne({
    model: MessageModel,
    filter: { _id: messageId, receiverId: user._id },
  });
  if (!message) {
    throw NotfoundException("Invaild Message Id");
  }
  if (!message.senderId) {
    throw BadRequestException(
      "This message was sent by a guest, the sender cannot be requested",
    );
  }
  if (message.senderId.toString() === user._id.toString()) {
    throw BadRequestException("You cannot request your own identity");
  }

  const existing = await findOne({
    model: RequestModel,
    filter: { messageId },
    options: { select: "status" },
  });
  if (existing) {
    throw ConflictException("A request already exists for this message");
  }

  try {
    return await createOne({
      model: RequestModel,
      data: {
        messageId,
        requesterId: user._id,
        senderId: message.senderId,
        status: RequestStatusEnum.PENDING,
      },
    });
  } catch (error) {
  
    if (error?.code === 11000) {
      throw ConflictException("A request already exists for this message");
    }
    throw error;
  }
};

export const getRequests = async ({ status, page, limit } = {}, user) => {
  return await paginate({
    model: RequestModel,
    filter: {
      senderId: user._id,
      ...(status !== undefined ? { status: Number(status) } : {}),
    },
    options: {
      sort: { createdAt: -1 },
      populate: { path: "messageId", select: "content attachments createdAt" },
    },
    page,
    limit,
  });
};


export const answerRequest = async ({ requestId, action }, user) => {
  const request = await findOne({
    model: RequestModel,
    filter: { _id: requestId, senderId: user._id },
  });
  if (!request) {
    throw NotfoundException("Invaild Request Id");
  }
  if (request.status !== RequestStatusEnum.PENDING) {
    throw ConflictException("This request has already been answered");
  }

  const newStatus =
    action === "accept"
      ? RequestStatusEnum.ACCEPTED
      : RequestStatusEnum.REJECTED;


  const updated = await findOneAndUpdate({
    model: RequestModel,
    filter: { _id: requestId, senderId: user._id, status: RequestStatusEnum.PENDING },
    update: { status: newStatus },
  });
  if (!updated) {
    throw ConflictException("This request has already been answered");
  }

  if (newStatus === RequestStatusEnum.REJECTED) {
    return { request: updated };
  }

  const conversation = await createOne({
    model: ConversationModel,
    data: {
      messageId: updated.messageId,
      requestId: updated._id,
      senderId: updated.senderId,
      receiverId: updated.requesterId,
    },
  });

  return { request: updated, conversation };
};

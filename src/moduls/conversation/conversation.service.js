import { NotfoundException } from "../../common/expceptions/error.exception.js";
import {
  createOne,
  findOne,
  paginate,
} from "../../common/repository/base.repository.js";
import {
  ConversationMessageModel,
  ConversationModel,
} from "../../db/models/index.js";

// Only the two users of the conversation can reach it.
// A non participant gets 404 so the existence of the conversation is not leaked.
const getMyConversation = async ({ conversationId }, user) => {
  const conversation = await findOne({
    model: ConversationModel,
    filter: {
      _id: conversationId,
      $or: [{ senderId: user._id }, { receiverId: user._id }],
    },
  });
  if (!conversation) {
    throw NotfoundException("Invaild Conversation Id");
  }
  return conversation;
};

export const listConversations = async ({ page, limit } = {}, user) => {
  return await paginate({
    model: ConversationModel,
    filter: { $or: [{ senderId: user._id }, { receiverId: user._id }] },
    options: { sort: { createdAt: -1 } },
    page,
    limit,
  });
};

export const sendConversationMessage = async (
  { conversationId, content },
  user,
) => {
  const conversation = await getMyConversation({ conversationId }, user);
  return await createOne({
    model: ConversationMessageModel,
    data: { conversationId: conversation._id, senderId: user._id, content },
  });
};

export const getConversationMessages = async (
  { conversationId, page, limit },
  user,
) => {
  const conversation = await getMyConversation({ conversationId }, user);
  return await paginate({
    model: ConversationMessageModel,
    filter: { conversationId: conversation._id },
    options: { sort: { createdAt: -1 } },
    page,
    limit,
  });
};

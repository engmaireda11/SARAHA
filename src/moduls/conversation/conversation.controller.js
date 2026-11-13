import { Router } from "express";
import { successResopnse } from "../../common/utils/index.js";
import { authentication, validation } from "../../middleware/index.js";
import * as validators from "./conversation.validation.js";
import {
  getConversationMessages,
  listConversations,
  sendConversationMessage,
} from "./conversation.service.js";

const router = Router();

router.get(
  "/",
  authentication(),
  validation(validators.listConversations),
  async (req, res, next) => {
    const data = await listConversations(req.validate.data.query, req.user);
    return successResopnse({ res, status: 200, data });
  },
);

router.post(
  "/:conversationId/messages",
  authentication(),
  validation(validators.sendMessage),
  async (req, res, next) => {
    const data = await sendConversationMessage(
      { ...req.validate.data.params, ...req.validate.data.body },
      req.user,
    );
    return successResopnse({ res, status: 201, data });
  },
);

router.get(
  "/:conversationId/messages",
  authentication(),
  validation(validators.getMessages),
  async (req, res, next) => {
    const data = await getConversationMessages(
      { ...req.validate.data.params, ...req.validate.data.query },
      req.user,
    );
    return successResopnse({ res, status: 200, data });
  },
);

export default router;

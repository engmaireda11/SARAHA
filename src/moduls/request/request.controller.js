import { Router } from "express";
import { successResopnse } from "../../common/utils/index.js";
import { authentication, validation } from "../../middleware/index.js";
import * as validators from "./request.validation.js";
import {
  answerRequest,
  createRequest,
  getRequests,
} from "./request.service.js";

const router = Router();

// receiver: ask to know who sent a message
router.post(
  "/",
  authentication(),
  validation(validators.createRequest),
  async (req, res, next) => {
    const data = await createRequest(req.validate.data.body, req.user);
    return successResopnse({ res, status: 201, data });
  },
);

// sender: view the requests he received
router.get(
  "/",
  authentication(),
  validation(validators.getRequests),
  async (req, res, next) => {
    const data = await getRequests(req.validate.data.query, req.user);
    return successResopnse({ res, status: 200, data });
  },
);

// sender: accept or reject
router.patch(
  "/:requestId",
  authentication(),
  validation(validators.answerRequest),
  async (req, res, next) => {
    const data = await answerRequest(
      { ...req.validate.data.params, ...req.validate.data.body },
      req.user,
    );
    return successResopnse({ res, status: 200, data });
  },
);

export default router;

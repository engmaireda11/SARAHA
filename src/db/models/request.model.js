import mongoose from "mongoose";
import { RequestStatusEnum } from "../../common/enum/index.js";

// A request made by the RECEIVER of an anonymous message to know who sent it.
// The SENDER of the message is the one who accepts / rejects it.
const requestSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Types.ObjectId,
      ref: "message",
      required: true,
      unique: true, // one request per message
    },
    requesterId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: Number,
      enum: Object.values(RequestStatusEnum),
      default: RequestStatusEnum.PENDING,
    },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strict: true,
    strictQuery: true,
    autoIndex: true,
  },
);

requestSchema.index({ senderId: 1, status: 1, createdAt: -1 });

export const RequestModel =
  mongoose.models.Request || mongoose.model("Request", requestSchema);

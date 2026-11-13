import mongoose from "mongoose";

// Created only after the sender accepts the identity request.
const conversationSchema = new mongoose.Schema(
  {
    messageId: {
      type: mongoose.Types.ObjectId,
      ref: "message",
      required: true,
      unique: true, // one conversation per original message
    },
    requestId: {
      type: mongoose.Types.ObjectId,
      ref: "Request",
      required: true,
    },
    senderId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
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

conversationSchema.index({ senderId: 1, createdAt: -1 });
conversationSchema.index({ receiverId: 1, createdAt: -1 });

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);

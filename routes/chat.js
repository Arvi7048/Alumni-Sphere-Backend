const express = require("express");
const { auth } = require("../middleware/auth");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

const router = express.Router();

// Helper to check if two arrays of ObjectIds contain a given id
const includesId = (arr, id) => arr.map(String).includes(String(id));

// @route   POST /api/chat/conversations
// @desc    Create or return a conversation between current user and recipient
// @access  Private
router.post("/conversations", auth, async (req, res) => {
  const { recipientId } = req.body;
  if (!recipientId) {
    return res.status(400).json({ message: "Recipient ID is required" });
  }

  try {
    // Try to find existing conversation between both participants
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [req.user.id, recipientId],
      });
      await conversation.save();
    }

    // Populate participants and lastMessage (if any)
    conversation = await Conversation.findById(conversation._id)
      .populate("participants", "name profileImage batch branch")
      .populate({
        path: "lastMessage",
        populate: { path: "sender", select: "name _id" },
      });

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/chat/conversations
// @desc    Get user's conversations (only those with messages)
// @access  Private
router.get("/conversations", auth, async (req, res) => {
  try {
    // Return only conversations the user participates in that have a lastMessage
    const conversations = await Conversation.find({
      participants: req.user.id,
      isActive: true,
      lastMessage: { $exists: true, $ne: null }, // IMPORTANT: only conversations with at least one message
    })
      .populate("participants", "name profileImage batch branch")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name _id profileImage",
        },
      })
      .sort({ updatedAt: -1 });

    // Deduplicate (if any accidental duplicates exist)
    const unique = [];
    const seen = new Set();
    for (const c of conversations) {
      const id = String(c._id);
      if (!seen.has(id)) {
        unique.push(c);
        seen.add(id);
      }
    }

    res.json({ success: true, data: unique });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/chat/conversations/:id/messages
// @desc    Get messages for a conversation
// @access  Private
router.get("/conversations/:id/messages", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!includesId(conversation.participants, req.user.id)) {
      return res.status(403).json({ message: "User not in this conversation" });
    }

    const messages = await Message.find({
      conversationId: req.params.id,
    })
      .populate("sender", "name profileImage")
      .sort({ createdAt: 1 });

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /api/chat/conversations/:id/messages
// @desc    Send a message
// @access  Private
router.post("/conversations/:id/messages", auth, async (req, res) => {
  const { text } = req.body;
  const { id: conversationId } = req.params;
  const senderId = req.user.id;

  try {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }
    if (!includesId(conversation.participants, senderId)) {
      return res.status(403).json({ message: "You are not part of this conversation" });
    }

    const newMessage = new Message({
      conversationId,
      sender: senderId,
      text,
    });

    await newMessage.save();

    // Update lastMessage and updatedAt
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    const populatedMessage = await Message.findById(newMessage._id).populate("sender", "name profileImage");

    // Emit message to conversation room
    const io = req.app.get("io");
    try {
      io.to(`conversation_${conversationId}`).emit("newMessage", populatedMessage);
    } catch (emitErr) {
      console.warn("Socket emit 'newMessage' warning:", emitErr.message || emitErr);
    }

    // Also emit updateConversation to participants to update sidebar
    const updatedConversation = await Conversation.findById(conversationId)
      .populate("participants", "name profileImage batch branch")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "name _id profileImage" } });

    // Only emit if lastMessage exists (it does) and conversation is active
    if (updatedConversation && updatedConversation.lastMessage) {
      updatedConversation.participants.forEach((participant) => {
        try {
          io.to(`user_${participant._id.toString()}`).emit("updateConversation", updatedConversation);
        } catch (err) {
          console.warn("Emit updateConversation warning:", err.message || err);
        }
      });
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    console.error("Send message error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

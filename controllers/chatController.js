const db = require("../config/db");

// GET conversation messages
exports.getMessages = async (req, res) => {
  try {
    const { senderId, receiverId } = req.query;

    if (!senderId || !receiverId) {
      return res.status(400).json({
        success: false,
        message: "senderId and receiverId are required",
      });
    }

    const query = `
      SELECT
        id,
        sender_id,
        receiver_id,
        message,
        timestamp,
        sender_id = ? AS isSender
      FROM messages
      WHERE
        (sender_id = ? AND receiver_id = ?)
        OR
        (sender_id = ? AND receiver_id = ?)
      ORDER BY timestamp ASC
    `;

    db.query(
      query,
      [senderId, senderId, receiverId, receiverId, senderId],
      (err, results) => {
        if (err) {
          console.error("Get messages error:", err);

          return res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
          });
        }

        return res.status(200).json({
          success: true,
          count: results.length,
          data: results,
        });
      }
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// SEND message
exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    if (!senderId || !receiverId || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "senderId, receiverId and message are required",
      });
    }

    const cleanMessage = message.trim();

    const query = `
      INSERT INTO messages (
        sender_id,
        receiver_id,
        message
      )
      VALUES (?, ?, ?)
    `;

    db.query(
      query,
      [senderId, receiverId, cleanMessage],
      (err, result) => {
        if (err) {
          console.error("Send message error:", err);

          return res.status(500).json({
            success: false,
            message: "Failed to send message",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Message sent successfully",
          data: {
            id: result.insertId,
            senderId,
            receiverId,
            message: cleanMessage,
          },
        });
      }
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

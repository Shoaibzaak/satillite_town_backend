const mongoose = require("mongoose");
const { Server } = require("socket.io");
const User = require("../models/User"); // Adjust path as needed
const Message = require("../models/Message"); // Adjust path as needed
const { getSingleUser } = require("../controllers/Auth/UserAuthController"); // Your token verification

let io = null; // Will be set after server creation

module.exports = {
  connect: (cb) => {
     const devUrl = `${process.env.BASE_URL}`;
    mongoose.connect(devUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      return cb(false);
    });

    db.once("open", () => {
      console.log("Connected to local MongoDB!");

      // Initialize socket handling after DB connection is established
      if (io) {
        initializeSocketHandlers(io);
      }

      return cb(true);
    });
  },

  // Add this new method to set up socket handling
  initializeSocket: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"],
      },
    });

    // Initialize handlers if DB is already connected
    if (mongoose.connection.readyState === 1) {
      initializeSocketHandlers(io);
    }
  },
};

// Separate function for socket handlers
function initializeSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Authentication handler for both roles
    socket.on("authenticate", async (userId) => {
      try {
        const user = await User.findOne({
          _id: userId
        });

        if (!user) {
          console.log("Authentication failed");
          return socket.disconnect();
        }

        socket.user = user;
        socket.join(`user_${user._id}`);
        console.log(`User ${user._id} (${user.role}) authenticated`);
        // Common message handler for both roles
        socket.on("send_message", async (messageData) => {
          try {
            // Validate recipient
            const recipient = await User.findOne({
              _id: messageData.recipientId
            });
            if (!recipient) {
              return socket.emit("message_error", {
                status: "error",
                message: "Recipient not found",
              });
            }

            // Validate role combinations (help_creator can only message help_seeker and vice versa)
            if (
              (user.role === "help_creator" &&
                recipient.role !== "help_seeker") ||
              (user.role === "help_seeker" && recipient.role !== "help_creator")
            ) {
              return socket.emit("message_error", {
                status: "error",
                message: "Invalid message recipient",
              });
            }

            // Create and save message
            const message = new Message({
              sender: user._id,
              recipients: [messageData.recipientId],
              content: messageData.text,
              isBroadcast: false,
            });

            const savedMessage = await message.save();

            // Send message to recipient
            io.to(`user_${messageData.recipientId}`).emit("new_message", {
              from: user._id,
              message: messageData.text,
              timestamp: new Date(),
              isBroadcast: false,
            });

            // Send confirmation to sender
            socket.emit("message_sent", {
              status: "success",
              message: savedMessage,
            });
          } catch (error) {
            socket.emit("message_error", {
              status: "error",
              message: error.message,
            });
          }
        });
      } catch (error) {
        console.error("Auth error:", error);
        socket.disconnect();
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
}

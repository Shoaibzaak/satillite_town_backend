// const mongoose = require("mongoose");
// const { Server } = require("socket.io");
// const User = require("../models/User"); // Adjust path as needed
// const Message = require("../models/Message"); // Adjust path as needed
// const { getSingleUser } = require("../controllers/Auth/UserAuthController"); // Your token verification

// let io = null; // Will be set after server creation

// module.exports = {
//   connect: (cb) => {
//      const devUrl = `${process.env.BASE_URL}`;
//     mongoose.connect(devUrl, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     const db = mongoose.connection;

//     db.on("error", (err) => {
//       console.error("MongoDB connection error:", err);
//       return cb(false);
//     });

//     db.once("open", () => {
//       console.log("Connected to local MongoDB!");

//       // Initialize socket handling after DB connection is established
//       if (io) {
//         initializeSocketHandlers(io);
//       }

//       return cb(true);
//     });
//   },

//   // Add this new method to set up socket handling
//   initializeSocket: (httpServer) => {
//     io = new Server(httpServer, {
//       cors: {
//         origin: "*", // Adjust for production
//         methods: ["GET", "POST"],
//       },
//     });

//     // Initialize handlers if DB is already connected
//     if (mongoose.connection.readyState === 1) {
//       initializeSocketHandlers(io);
//     }
//   },
// };

// // Separate function for socket handlers
// function initializeSocketHandlers(io) {
//   io.on("connection", (socket) => {
//     console.log("New client connected:", socket.id);

//     // Authentication handler for both roles
//     socket.on("authenticate", async (userId) => {
//       try {
//         const user = await User.findOne({
//           _id: userId
//         });

//         if (!user) {
//           console.log("Authentication failed");
//           return socket.disconnect();
//         }

//         socket.user = user;
//         socket.join(`user_${user._id}`);
//         console.log(`User ${user._id} (${user.role}) authenticated`);
//         // Common message handler for both roles
//         socket.on("send_message", async (messageData) => {
//           try {
//             // Validate recipient
//             const recipient = await User.findOne({
//               _id: messageData.recipientId
//             });
//             if (!recipient) {
//               return socket.emit("message_error", {
//                 status: "error",
//                 message: "Recipient not found",
//               });
//             }

//             // Validate role combinations (help_creator can only message help_seeker and vice versa)
//             if (
//               (user.role === "help_creator" &&
//                 recipient.role !== "help_seeker") ||
//               (user.role === "help_seeker" && recipient.role !== "help_creator")
//             ) {
//               return socket.emit("message_error", {
//                 status: "error",
//                 message: "Invalid message recipient",
//               });
//             }

//             // Create and save message
//             const message = new Message({
//               sender: user._id,
//               recipients: [messageData.recipientId],
//               content: messageData.text,
//               isBroadcast: false,
//             });

//             const savedMessage = await message.save();

//             // Send message to recipient
//             io.to(`user_${messageData.recipientId}`).emit("new_message", {
//               from: user._id,
//               message: messageData.text,
//               timestamp: new Date(),
//               isBroadcast: false,
//             });

//             // Send confirmation to sender
//             socket.emit("message_sent", {
//               status: "success",
//               message: savedMessage,
//             });
//           } catch (error) {
//             socket.emit("message_error", {
//               status: "error",
//               message: error.message,
//             });
//           }
//         });
//       } catch (error) {
//         console.error("Auth error:", error);
//         socket.disconnect();
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log("Client disconnected:", socket.id);
//     });
//   });
// }
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");
const { getSingleUser } = require("../controllers/Auth/UserAuthController");

let io = null;

// Configure allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      'https://your-frontend.vercel.app',
      'https://satillite-town-backend-5i11.vercel.app'
    ]
  : [
      'http://localhost:3000',
      process.env.BASE_URL1
    ];

module.exports = {
  connect: (cb) => {
    const devUrl = `${process.env.BASE_URL}`;
    mongoose.connect(devUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });

    const db = mongoose.connection;

    db.on("error", (err) => {
      console.error("MongoDB connection error:", err);
      return cb(false);
    });

    db.once("open", () => {
      console.log("Connected to MongoDB!");
      if (io) initializeSocketHandlers(io);
      return cb(true);
    });
  },

  initializeSocket: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    if (mongoose.connection.readyState === 1) {
      initializeSocketHandlers(io);
    }
  },
};

function initializeSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const user = await getSingleUser(token);
      if (!user) return next(new Error('Authentication error'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User ${socket.user._id} (${socket.user.role}) connected`);

    // Join user-specific room
    socket.join(`user_${socket.user._id}`);

    socket.on("send_message", async (messageData) => {
      try {
        // Validate recipient exists
        const recipient = await User.findById(messageData.recipientId);
        if (!recipient) {
          return socket.emit("error", "Recipient not found");
        }

        // Validate role relationships
        const validRoles = (
          (socket.user.role === "help_creator" && recipient.role === "help_seeker") ||
          (socket.user.role === "help_seeker" && recipient.role === "help_creator")
        );

        if (!validRoles) {
          return socket.emit("error", "Invalid recipient role");
        }

        // Create and save message
        const message = new Message({
          sender: socket.user._id,
          recipients: [messageData.recipientId],
          content: messageData.text,
          isBroadcast: false,
        });

        await message.save();

        // Emit to recipient
        io.to(`user_${messageData.recipientId}`).emit("new_message", {
          _id: message._id,
          from: socket.user._id,
          message: messageData.text,
          timestamp: new Date(),
        });

        // Confirm to sender
        socket.emit("message_sent", {
          status: "success",
          messageId: message._id
        });

      } catch (error) {
        console.error("Message error:", error);
        socket.emit("error", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${socket.user._id} disconnected`);
    });
  });
}
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageModel = new Schema(
 {
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipients: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  content: { 
    type: String, 
    required: true 
  },
  isBroadcast: { 
    type: Boolean, 
    default: false 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  // Add these for better querying
  conversationId: {
    type: String,
  }
}
);

MessageModel.set("toJSON", {
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
  },
});

const Message = mongoose.model("Message", MessageModel);
module.exports = Message;

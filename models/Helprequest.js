const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const HelpRequestSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  needDescription: {
    type: String,
    // required: true
  },
  helpType: {
    type: String,
    // enum: ['financial', 'medical', 'food', 'shelter', 'education', 'employment', 'other'],
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  documents: [{
    type: String // URLs to any supporting documents
  }],
  location: {
    type: String,
    // required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },

});

HelpRequestSchema.set("toJSON", {
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    delete ret.password;
  },
});

const HelpRequest = mongoose.model("HelpRequestSchema", HelpRequestSchema);
module.exports = HelpRequest;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const NgoModel = new Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    //   required: true,
    },
    image: {
      type: String,
    //   required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

NgoModel.set("toJSON", {
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    delete ret.password;
  },
});

const Ngo = mongoose.model("Ngo", NgoModel);
module.exports = Ngo;

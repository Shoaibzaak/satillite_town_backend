const mongoose = require("mongoose");
const Model = require("../models/index");
const HTTPError = require("../utils/CustomError");
const Status = require("../status");
const catchAsync = require("../utils/catchAsync");
const cloudUpload = require("../cloudinary");
const cloudinary = require("cloudinary");

module.exports = {
  // Retrieve Ngo user by NgoId
  getNgo: catchAsync(async (req, res, next) => {
    console.log("findNgoById is called");
    try {
      var NgoId = req.params.id;
      var result = await Model.Ngo.findById({_id:NgoId});

      var message = "NgoId found successfully";
      if (result == null) {
        message = "NgoId does not exist.";
      }
      res.ok(message, result);
    } catch (error) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, error);
    }
  }),

  createNgo: catchAsync(async (req, res, next) => {
    console.log("createNgo is called");
    try {
      var NgoData = req.body;
      // Upload primary image if provided
      if (req.files && req.files.image) {
        const primaryImages = req.files.image;
        const primaryImage = primaryImages[0];
        const { path } = primaryImage;
        const newPath = await cloudUpload.cloudinaryUpload(path);
        NgoData.image = newPath;
      }
        
      const Ngo = new Model.Ngo(NgoData);
      await Ngo.save();
      var message = "Ngo created successfully";
      if (Ngo == null) {
        message = "Ngo does not exist.";
      }

      res.ok(message, Ngo);
    } catch (error) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, error.message);
    }
  }),
 createQuery: catchAsync(async (req, res, next) => {
    try {
      var NgoData = req.body;
      const Ngo = new Model.Query(NgoData);
      await Ngo.save();
      var message = "query created successfully";
      if (Ngo == null) {
        message = "query does not exist.";
      }

      res.ok(message, Ngo);
    } catch (error) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, error.message);
    }
  }),

createHelpRequest : catchAsync(async (req, res, next) => {
    console.log("createHelpRequest is called");
    try {
      var helpRequestData = req.body;
      // Upload documents if provided
     if (req.files && req.files.documents) {
        const primaryImages = req.files.documents;
        const primaryImage = primaryImages[0];
        const { path } = primaryImage;
        const newPath = await cloudUpload.cloudinaryUpload(path);
        helpRequestData.documents = newPath;
      }
        
      const helpRequest = new Model.HelpRequest(helpRequestData);
      await helpRequest.save();
      
      var message = "Help request created successfully";
      if (!helpRequest) {
        message = "Help request could not be created.";
      }

      res.ok(message, helpRequest);
    } catch (error) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, error.message);
    }
  }),
  // Get all Ngo users with full details
  getAllNgo: catchAsync(async (req, res, next) => {
    console.log("Ngodetails is called");
    try {
      var message = "Ngodetails found successfully";
      var Ngos = await Model.Ngo.find()
        .sort("-_id");
      const NgoSize = Ngos.length;
      const result = {
        Ngo: Ngos,
        count: NgoSize,
      };
      if (result == null) {
        message = "Ngodetails does not exist.";
      }
      var message = "Ngo  details find successfully";
      res.ok(message, result);
    } catch (error) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, error);
    }
  }),
    getAllquery: catchAsync(async (req, res, next) => {
    console.log("Ngodetails is called");
    try {
      var message = "Ngodetails found successfully";
      var Ngos = await Model.Query.find()
        .sort("-_id");
      const NgoSize = Ngos.length;
      const result = {
        Ngo: Ngos,
        count: NgoSize,
      };
      if (result == null) {
        message = "querydetails does not exist.";
      }
      var message = "query  details find successfully";
      res.ok(message, result);
    } catch (error) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, error);
    }
  }),

  // Update a Ngo user
  updateNgo: catchAsync(async (req, res, next) => {
    try {
      // Get the Ngo data from the request body
      console.log("update ngo")
      const { title, description,NgoId} = req.body;
      // Initialize update object
      const updateObject = {};
  
      // Update title and description if provided
      if (title) updateObject["title"] = title;
      if (description) updateObject["description"] = description;
  
      // Upload primary image if provided
     if (req.files?.image) {
      const primaryImage = req.files.image[0];
      const { path } = primaryImage;
      const newPath = await cloudUpload.cloudinaryUpload(path);
      updateObject.image = newPath; // Add image to update object
    }
  
      // Update the Ngo
      const result = await Model.Ngo.findOneAndUpdate(
        { _id: NgoId },
        updateObject,
        { new: true }
      );
  
      if (!result) {
        throw new Error("Ngo not found");
      }
      const message = "Ngo status updated successfully";
      res.ok(message, result); // Sending the response with the updated result
    } catch (err) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, err.message);
    }
  }),  

  // Delete a Ngo user
  declineNgo: catchAsync(async (req, res, next) => {
    var NgoId = req.params.id;
    try {
      const NgoUser = await Model.Ngo.findByIdAndDelete({_id:NgoId});
      if (!NgoUser)
        return res.badRequest("Ngo Not Found in our records");

      // Deleting primaryImage from Cloudinary
      if (NgoUser.image) {
        const publicId = NgoUser.image.split("/").pop();
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error(
              "Error deleting profilePic from Cloudinary:",
              error
            );
            // Handle the error if needed
          } else {
            console.log("profilePic deleted from Cloudinary:", result);
          }
        });
      }
      // Remove Ngo from database
      var message = "Ngo user deleted successfully";
      res.ok(message);
    } catch (err) {
      throw new HTTPError(Status.INTERNAL_SERVER_ERROR, err);
    }
  }),


};

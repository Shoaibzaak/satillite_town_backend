const express = require("express");
const Controller = require("../controllers/index");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const Authentication = require("../services/index");

// Storage configuration
const userStorage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// File filter for images
const imageFileFilter = function (req, file, callback) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedImageTypes = [".png", ".jpg", ".gif", ".jpeg"];
  if (allowedImageTypes.includes(ext)) {
    callback(null, true);
  } else {
    callback(new Error("Only images are allowed"));
  }
};

// File filter for documents
const documentFileFilter = function (req, file, callback) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedDocTypes = [".pdf", ".doc", ".docx", ".txt", ".png", ".jpg", ".jpeg"];
  if (allowedDocTypes.includes(ext)) {
    callback(null, true);
  } else {
    callback(new Error("Only documents and images are allowed"));
  }
};

// Create separate upload instances for different file types
const uploadImage = multer({
  storage: userStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

const uploadDocuments = multer({
  storage: userStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

// const upload = multer({
//   storage: userStorage,
//   fileFilter: function (req, file, callback) {
//     if (file.fieldname === "image") {
//       imageFileFilter(req, file, callback);
//     }  
//     else {
//       callback(new Error("Invalid fieldname"));
//     }
//   },
//   limits: {
//     fileSize: 10 * 1024 * 1024, // 10 MB limit
//   },
// });

//post custom NgoPost
router.route("/createNgo").post(
   uploadImage.fields([{ name: "image", maxCount: 1 }]),
//   Authentication.UserAuth,
  Controller.ngoController.createNgo
);

router.route("/createRequest").post(
   uploadDocuments.fields([{ name: "documents", maxCount: 5 }]),
//   Authentication.UserAuth,
  Controller.ngoController.createHelpRequest
);
//update NgoPost
router.route("/updateNgo").put(
//   Authentication.UserAuth,
  // upload.fields([
  //   {
  //     name: "image",
  //     maxCount: 1,
  //   },
  // ]),
  Controller.ngoController.updateNgo
);

//delete NgoPost
router
  .route("/deleteNgo/:id")
  .delete(
    // Authentication.UserAuth, 
    Controller.ngoController.declineNgo);

// get NgoPost by id
router.route("/findNgoById/:id").get(
  // Authentication.UserAuth,
  Controller.ngoController.getNgo
);

// get all  NgoPosts with details
router.route("/getAllNgos").get(
  //  Authentication.UserAuth,
  Controller.ngoController.getAllNgo
);

module.exports = router;

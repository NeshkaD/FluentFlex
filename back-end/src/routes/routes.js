module.exports = web_app => {
    let router = require("express").Router();
    const userController = require("../controllers/user.controller.js");
    const contentController = require("../controllers/content.controller.js");
  
    // Get list of content infos by userId.
    router.get("/user/:userId/contentinfolist", userController.getContentInfoListByUserId);

    // Get details for a specific user by ID:
    router.get("/user/:userId", userController.getUserById); 

    // Update user details for a specific user by ID:
    router.put("/user", userController.update); 

    // Delete user by ID:
    router.delete("/user/:userId", userController.delete); 

    // Authenticate a user
    router.post("/user/authenticate", userController.authenticateUser);  

    // Post username, email address, and password to create a new user in the user table:
    router.post("/user", userController.createUser);  

    // Update an srtDetail when user submits an answer.
    router.patch("/content/srtdetail/answer", contentController.patchSrtDetailBasedOnAnswer);

    // Get info about a contentItem without getting the audio file blob
    router.get("/content/:contentId/info", contentController.getContentInfoById); 

    // Get list of SrtDetails for a given content item.
    router.get("/content/:contentId/srtdetails", contentController.getSrtDetailsByContentId); 

    // Get audio file blob for content item.
    router.get("/content/:contentId", contentController.getContentById); 

    // Delete audio file blob and srt details for content item.
    router.delete("/content/:contentId", contentController.deleteContentById); 

    // Initialize multer middleware for HTTP multipart requests and configure to use in-memory storage instead of filesystem.
    const multer  = require('multer')
    const storage = multer.memoryStorage()
    const upload = multer({ storage: storage })

    // Post demo data to content table for the user making the request
    router.post("/content/demo-content", contentController.createDemoContentForUser);

    // Post content (mp3 and srt files) to content_item, srt_item, and srt_details tables.
    router.post(
      "/content",
      upload.fields(
        [
          { name: 'media', maxCount: 1 },
          { name: 'userLangSrt', maxCount: 1 },
          { name: 'foreignLangSrt', maxCount: 1 },
        ]
      ),
      contentController.createContent
    );  
  
    // Instruct the server to use these routes:
    web_app.use('/', router);
  };
  
module.exports = web_app => {
    let router = require("express").Router();
    const userController = require("../controllers/user.controller.js");
    const contentController = require("../controllers/content.controller.js");

  
    // Get list of content infos by userId.
    router.get("/user/:userId/contentinfolist", userController.getContentInfoListByUserId);
    // TODO: change to use URL query paramaters and move to content controller.

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
  
    web_app.use('/', router);
  };
  
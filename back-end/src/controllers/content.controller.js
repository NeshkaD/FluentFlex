const Content = require("../models/content.model.js");
const User = require("../models/user.model.js");

// Handle request to upload new MP3 audio and SRT files to the database
exports.createContent = (req, res) => {
    console.log('content.controller::createContent called');

    // Validate that files were sent:
    if (req.files === null) {
        console.log(`Files failed validation. Files array is null.`);
        let returnObj = {
            "success": false,
            "error": "Files must be sent. No files were sent."
        };
        res.send(returnObj);
        return;
    }

    // Validate that MP3 file was sent:
    if (req.files.media === null) {
        console.log(`media failed validation. media is null.`);
        let returnObj = {
            "success": false,
            "error": "Media file was missing from request"
        };
        res.send(returnObj);
        return;
    }

    // Validate that translation SRT file was sent:
    if (req.files.userLangSrt === null) {
        console.log(`userLangSrt failed validation. userLangSrt is null.`);
        let returnObj = {
            "success": false,
            "error": "userLangSrt file was missing from request"
        };
        res.send(returnObj);
        return;
    }

    // Validate that SRT file in the same language as the MP3 audio was sent:
    if (req.files.foreignLangSrt === null) {
        console.log(`foreignLangSrt failed validation. foreignLangSrt is null.`);
        let returnObj = {
            "success": false,
            "error": "foreignLangSrt file was missing from request"
        };
        res.send(returnObj);
        return;
    }

    // Validate that userId was sent:
    if (req.body.userId === null) {
        console.log(`userId failed validation. userId ${req.body.userId}`);
        let returnObj = {
            "success": false,
            "error": "UserId cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Validate that userId is a valid number:
    if (Number.isNaN(req.body.userId)) {
        console.log(`userId failed number validation. userId ${req.body.userId}`);
        let returnObj = {
            "success": false,
            "error": "UserId must be a number"
        };
        res.send(returnObj);
        return;
    }

    let userIdNum = Number.parseInt(req.body.userId);

    // Validate that content type was specified in request:
    if (req.body.type === null) {
        console.log(`type failed validation. type ${req.body.type}`);
        let returnObj = {
            "success": false,
            "error": "Type cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Validate that content language was specified in the request:
    if (req.body.contentLanguage === null) {
        console.log(`contentLanguage failed validation. contentLanguage ${req.body.contentLanguage}`);
        let returnObj = {
            "success": false,
            "error": "contentLanguage cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Validate that translation language was specified in the request:
    if (req.body.translationLanguage === null) {
        console.log(`translationLanguage failed validation. translationLanguage ${req.body.translationLanguage}`);
        let returnObj = {
            "success": false,
            "error": "translationLanguage cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Validate that MP3 content title was specified in the request:
    if (req.body.mediaTitle === null) {
        console.log(`mediaTitle failed validation. mediaTitle ${req.body.mediaTitle}`);
        let returnObj = {
            "success": false,
            "error": "MediaTitle cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Validate that author was specified in the request:
    if (req.body.mediaAuthor === null) {
        console.log(`mediaAuthor failed validation. mediaAuthor ${req.body.mediaAuthor}`);
        let returnObj = {
            "success": false,
            "error": "MediaAuthor cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Convert SRT files from binary to Strings:
    let userLangSrt = req.files.userLangSrt[0].buffer.toString();
    let foreignLangSrt = req.files.foreignLangSrt[0].buffer.toString();


    // Import substitles-parser and use it to convert SRT strings to objects:
    let parser = require('subtitles-parser');
    let userLangSrtData = parser.fromSrt(userLangSrt);
    let foreignLangSrtData = parser.fromSrt(foreignLangSrt);

    // Call model method to save MP3 blob and SRT strings into the DB:
    Content.createContent(
        userIdNum,
        req.body.type,
        req.body.contentLanguage,
        req.body.translationLanguage,
        req.files.media[0].buffer,
        req.body.mediaTitle,
        req.body.mediaAuthor,
        userLangSrtData,
        foreignLangSrtData,
        (newContentId) => {
            console.log("content.controller::createContent responding with http success");
            // Send HTTP response to client with success and the new content ID:
            res.send(
                {
                    success: true,
                    id: newContentId,
                    error: null
                })
        },
        (dbError) => {
            console.log("content.controller::createContent responding with http error");
            // Send HTTP response to client with error info:
            res.send(
                {
                    success: false,
                    id: null,
                    error: dbError
                })
        }
    )
};

// Handle request to get binary blob of MP3 data by ID
exports.getContentById = (req, res) => {
    console.log('content.controller::getContentById called');

    // Call model method to retrieve the MP3 blob from the DB
    Content.findContentById(
        req.params.contentId,
        (content, err) => {
            if (err) {
                res.sendStatus(500);
            }
            console.log(content);
            let buffer = Buffer.from(content.media);
            res.set({
                "Accept-Ranges": "bytes" // To stop media restarting at 0 seconds, per this answer: https://stackoverflow.com/questions/36783521/why-does-setting-currenttime-of-html5-video-element-reset-time-in-chrome
            // More info: https://stackoverflow.com/questions/65941347/how-can-i-add-the-accept-ranges-header-to-the-response-in-nodejs
            
            });
            res.send(buffer); // Send HTTP response to user with MP3 audio as stream of bytes
        }
    );
};

// Handle request to MP3 content metadata without actually getting the audio blob
exports.getContentInfoById = (req, res) => {
    console.log('content.controller::getContentInfoById called');

    // Call model method to retrieve the MP3 blob's metadata from the DB:
    Content.findContentInfoById(
        req.params.contentId,
        (result) => {
        // Return 404 error if MP3 content not found:
        if (result.length < 1) {
            res.sendStatus(404);
        }

        // Return 500 server error if too much info found - this should never happen if DB is correctly configured:
        if (result.length > 1) {
            console.log(`content.controller::get found multiple with `);
            res.sendStatus(500);
        }
        let returnObj = {
            "id": result.id,
            "userId": result.user_id,
            "type": result.type,
            "language": result.language,
            "mediaTitle": result.media_title,
            "mediaAuthor": result.media_author
        }
        res.send(returnObj); // Send HTTP response to client with metadata about the requested MP3.
    },
    (error) => {
        console.log(error);
        res.sendStatus(404);
    });
};

// Handle request for all SRT information relating to an MP3 content item
exports.getSrtDetailsByContentId = (req, res) => {
    console.log('content.controller::getSrtDetailsByContentId called');
    let returnObj = {};
    // Call model method to get the SRT item IDs relating to the MP3 content ID:
    Content.findSrtItemIdsAndInfoByContentId(
        req.params.contentId,
        (srtItemIdsAndInfo, err) => {
            console.log(srtItemIdsAndInfo);
            if (err) {
                res.sendStatus(500);
            }
            else {
                if (srtItemIdsAndInfo.length < 2) {
                    res.sendStatus(500);
                    return;   
                }

                // Call model method to get the SRT details (lines) relating to the first SRT item ID:
                Content.findSrtDetailsBySrtItemId(
                    srtItemIdsAndInfo[0].id,
                    (srtDetails1, err) => {
                        console.log(srtDetails1);
                        if (err) {
                            res.sendStatus(500);
                        }
                        returnObj[srtItemIdsAndInfo[0].language] = srtDetails1;

                        // Call model method to get the SRT details (lines) relating to the first SRT item ID:
                        Content.findSrtDetailsBySrtItemId(
                            srtItemIdsAndInfo[1].id,
                            (srtDetails2, err) => {
                                console.log(srtDetails2);
                                if (err) {
                                    res.sendStatus(500);
                                }
                                returnObj[srtItemIdsAndInfo[1].language] = srtDetails2;
                                res.send(returnObj); // Send HTTP response to client with all the SRT lines for study/quiz modes.
                            }
                        );
                    }
                );
            }
        }
    );
};

// Handle request to update user score on an SRT line based on correct or incorrect answer
exports.patchSrtDetailBasedOnAnswer = (req, res) =>  {
    console.log('content.controller::patchSrtDetailBasedOnAnswer called');

    // Call model method to update scores in DB:
    Content.patchSrtDetailBasedOnAnswer(
        req.body.srtDetailId,
        req.body.isCorrectAnswer,
        (result, err) => {
            // If an error occurred, send 500 HTTP response to client:
            if (err) {
                res.sendStatus(500);
            }
            res.send({success: true, error: null}); // Send success HTTP response to client
        }
    );
};

// Handle request to delete MP3 file and SRT file data from the database based on a given MP3 content ID
exports.deleteContentById = (req, res) => {
    console.log('content.controller::deleteContentById called');
    let contentId = req.params.contentId;

    // Call model method to delete MP3 and SRT file data:
    Content.delete(contentId,
        // Send success HTTP resposne to client:
        (result) => res.send(
            {
                success: true,
                error: null
            }
        ),
        // Send success HTTP resposne to client with error info:
        (db_error) => res.send(
            {
                success: false,
                error: db_error
            }
        )
    );
};

// Handle request to add demo data to a user's account
exports.createDemoContentForUser = (req, res) => {
    console.log('content.controller::createDemoContentForUser called');

    // Validate user ID:
    if (req.body.userId === null) {
        console.log(`userId failed validation. userId ${req.body.userId}`);
        let returnObj = {
            success: false,
            id: null,
            error: "userId cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    // Import Node fs library for interacting with the filesystem on the server:
    let fs = require('fs');

    // Read the SRT and MP3 demo files from the server filesystem as binary buffers:
    let demoContent1Buffer;
    let demoContentSrt1Buffer;
    let demoTranslationSrt1Buffer;

    let demoContent2Buffer;
    let demoContentSrt2Buffer;
    let demoTranslationSrt2Buffer;

    let demoContent3Buffer;
    let demoContentSrt3Buffer;
    let demoTranslationSrt3Buffer;
    try {
        demoContent1Buffer = fs.readFileSync('demo/demo_content_1.mp3');
        demoContentSrt1Buffer = fs.readFileSync("demo/demo_srt_1.srt");
        demoTranslationSrt1Buffer = fs.readFileSync("demo/demo_translation_srt_1.srt");
        demoContent2Buffer = fs.readFileSync('demo/demo_content_2.mp3');
        demoContentSrt2Buffer = fs.readFileSync("demo/demo_srt_2.srt");
        demoTranslationSrt2Buffer = fs.readFileSync("demo/demo_translation_srt_2.srt");
        demoContent3Buffer = fs.readFileSync('demo/demo_content_3.mp3');
        demoContentSrt3Buffer = fs.readFileSync("demo/demo_srt_3.srt");
        demoTranslationSrt3Buffer = fs.readFileSync("demo/demo_translation_srt_3.srt");
    } catch (err) {
        res.status(500).send(`Error occurred while copying demo data: ${err}`);
    }

    // Parse the SRT binary data to obtain SRT strings for each demo file set:
    let parser = require('subtitles-parser');
    let translationLangSrtData1 = parser.fromSrt(demoTranslationSrt1Buffer.toString());
    let contentLangSrtData1 = parser.fromSrt(demoContentSrt1Buffer.toString());
    let demoDataType1 = "video";
    let demoDataContentLanguage1 = "Spanish";
    let demoDataTranslationLanguage1 = "English";
    let demoMediaTitle1 = "Buena Gente";
    let demoMediaAuthor1 = "Spanish Playground";

    let translationLangSrtData2 = parser.fromSrt(demoTranslationSrt2Buffer.toString());
    let contentLangSrtData2 = parser.fromSrt(demoContentSrt2Buffer.toString());
    let demoDataType2 = "movie clip";
    let demoDataContentLanguage2 = "German";
    let demoDataTranslationLanguage2 = "English";
    let demoMediaTitle2 = "Henry Hühnchen";
    let demoMediaAuthor2 = "The Fable Cottage";

    let translationLangSrtData3 = parser.fromSrt(demoTranslationSrt3Buffer.toString());
    let contentLangSrtData3 = parser.fromSrt(demoContentSrt3Buffer.toString());
    let demoDataType3 = "song";
    let demoDataContentLanguage3 = "French";
    let demoDataTranslationLanguage3 = "English";
    let demoMediaTitle3 = "Dernière Danse";
    let demoMediaAuthor3 = "Indila";

    // Call model method to create demo data in DB for demo file set 1:
    Content.createContent(
        req.body.userId,
        demoDataType1,
        demoDataContentLanguage1,
        demoDataTranslationLanguage1,
        demoContent1Buffer,
        demoMediaTitle1,
        demoMediaAuthor1,
        translationLangSrtData1,
        contentLangSrtData1,
        (newContentId) => {
            // Call model method to create demo data in DB for demo file set 2:
            Content.createContent(
                req.body.userId,
                demoDataType2,
                demoDataContentLanguage2,
                demoDataTranslationLanguage2,
                demoContent2Buffer,
                demoMediaTitle2,
                demoMediaAuthor2,
                translationLangSrtData2,
                contentLangSrtData2,
                (newContentId) => {
                    // Call model method to create demo data in DB for demo file set 3:
                    Content.createContent(
                        req.body.userId,
                        demoDataType3,
                        demoDataContentLanguage3,
                        demoDataTranslationLanguage3,
                        demoContent3Buffer,
                        demoMediaTitle3,
                        demoMediaAuthor3,
                        translationLangSrtData3,
                        contentLangSrtData3,
                        (newContentId) => {
                            // Send success HTTP response to client:
                            res.send(
                                {
                                    success: true,
                                    error: null
                                });
                        },
                        (dbError) => {
                            console.log("content.controller::createContent responding with http error");
                            // Send error HTTP response to client with error info:
                            res.send(
                                {
                                    success: false,
                                    error: dbError
                                });
                        }
                    );
                },
                (dbError) => {
                    console.log("content.controller::createContent responding with http error");
                    // Send HTTP response to client with database error info:
                    res.send(
                        {
                            success: false,
                            error: dbError
                        });
                }
            );
        },
        (dbError) => {
            console.log("content.controller::createContent responding with http error");
            // Send HTTP response to client with database error info:
            res.send(
                {
                    success: false,
                    error: dbError
                });
        }
    );
};

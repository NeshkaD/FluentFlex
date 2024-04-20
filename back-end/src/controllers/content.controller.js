const Content = require("../models/content.model.js");
const User = require("../models/user.model.js");

exports.createContent = (req, res) => {
    console.log('content.controller::createContent called');

    console.log(req.body);
    console.log(req.files);

    console.log(req.get('Content-Type'));

    if (req.files === null) {
        console.log(`Files failed validation. Files array is null.`);
        let returnObj = {
            "success": false,
            "error": "Files must be sent. No files were sent."
        };
        res.send(returnObj);
        return;
    }

    if (req.files.media === null) {
        console.log(`media failed validation. media is null.`);
        let returnObj = {
            "success": false,
            "error": "Media file was missing from request"
        };
        res.send(returnObj);
        return;
    }

    if (req.files.userLangSrt === null) {
        console.log(`userLangSrt failed validation. userLangSrt is null.`);
        let returnObj = {
            "success": false,
            "error": "userLangSrt file was missing from request"
        };
        res.send(returnObj);
        return;
    }

    if (req.files.foreignLangSrt === null) {
        console.log(`foreignLangSrt failed validation. foreignLangSrt is null.`);
        let returnObj = {
            "success": false,
            "error": "foreignLangSrt file was missing from request"
        };
        res.send(returnObj);
        return;
    }

    if (req.body.userId === null) {
        console.log(`userId failed validation. userId ${req.body.userId}`);
        let returnObj = {
            "success": false,
            "error": "UserId cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (Number.isNaN(req.body.userId)) { // TODO: verify that it's a positive integer, not just that it's a number.
        console.log(`userId failed number validation. userId ${req.body.userId}`);
        let returnObj = {
            "success": false,
            "error": "UserId must be a number"
        };
        res.send(returnObj);
        return;
    }

    let userIdNum = Number.parseInt(req.body.userId);

    if (req.body.type === null) {
        console.log(`type failed validation. type ${req.body.type}`);
        let returnObj = {
            "success": false,
            "error": "Type cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (req.body.contentLanguage === null) {
        console.log(`contentLanguage failed validation. contentLanguage ${req.body.contentLanguage}`);
        let returnObj = {
            "success": false,
            "error": "contentLanguage cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (req.body.translationLanguage === null) {
        console.log(`translationLanguage failed validation. translationLanguage ${req.body.translationLanguage}`);
        let returnObj = {
            "success": false,
            "error": "translationLanguage cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (req.body.mediaTitle === null) {
        console.log(`mediaTitle failed validation. mediaTitle ${req.body.mediaTitle}`);
        let returnObj = {
            "success": false,
            "error": "MediaTitle cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    if (req.body.mediaAuthor === null) {
        console.log(`mediaAuthor failed validation. mediaAuthor ${req.body.mediaAuthor}`);
        let returnObj = {
            "success": false,
            "error": "MediaAuthor cannot be empty"
        };
        res.send(returnObj);
        return;
    }

    let userLangSrt = req.files.userLangSrt[0].buffer.toString();
    let foreignLangSrt = req.files.foreignLangSrt[0].buffer.toString();


    // SUBTITLES-PARSER: good, but timestamp is hard to work with
    let parser = require('subtitles-parser');
    let userLangSrtData = parser.fromSrt(userLangSrt);
    let foreignLangSrtData = parser.fromSrt(foreignLangSrt);


    // TODO: improve auth with tokens
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
            res.send(
                {
                    success: true,
                    id: newContentId,
                    error: null
                })
        },
        (dbError) => {
            console.log("content.controller::createContent responding with http error");
            res.send(
                {
                    success: false,
                    id: null,
                    error: dbError
                })
        }
    )
};

exports.getContentById = (req, res) => {
    console.log('content.controller::getContentById called');
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
            res.send(buffer);
        }
    );
};

exports.getContentInfoById = (req, res) => {
    console.log('content.controller::getContentInfoById called');
    Content.findContentInfoById(
        req.params.contentId,
        (result) => {
        if (result.length < 1) {
            res.sendStatus(404); // TODO: Rainyday test for this!
        }
        if (result.length > 1) {
            console.log(`content.controller::get found multiple with `);
            res.sendStatus(500); // TODO: This probably is not testable, as DB key unique
        }
        let returnObj = { // convert DB format to JS camelcase standard.
            "id": result.id,
            "userId": result.user_id,
            "type": result.type,
            "language": result.language,
            "mediaTitle": result.media_title,
            "mediaAuthor": result.media_author
        }
        res.send(returnObj);
    },
    (error) => {
        console.log(error);
        res.sendStatus(404); // TODO: This callback fixes bugging out when content id requested does not exist: TypeError: err_callback is not a function. BUT, we should probably send empty response, not a 404.
    });
};

exports.getSrtDetailsByContentId = (req, res) => { // TODO: Maybe implement similar method that only returns srt_details in the content language. And a separate method for user's own language(s).
    console.log('content.controller::getSrtDetailsByContentId called');
    let returnObj = {};
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
                Content.findSrtDetailsBySrtItemId(
                    srtItemIdsAndInfo[0].id, // TODO: errors out when srtItemIdsAndInfo is undefined. Possibly now fixed. Test.
                    (srtDetails1, err) => {
                        console.log(srtDetails1);
                        if (err) {
                            res.sendStatus(500);
                        }
                        returnObj[srtItemIdsAndInfo[0].language] = srtDetails1;
                        Content.findSrtDetailsBySrtItemId(
                            srtItemIdsAndInfo[1].id, // TODO: Change this to for loop implementation to handle higher number of srt items if needed.
                            (srtDetails2, err) => {
                                console.log(srtDetails2);
                                if (err) {
                                    res.sendStatus(500);
                                }
                                returnObj[srtItemIdsAndInfo[1].language] = srtDetails2;
                                res.send(returnObj);
                            }
                        );
                    }
                );
            }
        }
    );
};

exports.patchSrtDetailBasedOnAnswer = (req, res) =>  {
    console.log('content.controller::patchSrtDetailBasedOnAnswer called');
    Content.patchSrtDetailBasedOnAnswer(
        req.body.srtDetailId,
        req.body.isCorrectAnswer,
        (result, err) => {
            if (err) {
                res.sendStatus(500);
            }
            res.send({success: true, error: null});
        }
    );
};

exports.deleteContentById = (req, res) => {
    console.log('content.controller::deleteContentById called');
    let contentId = req.params.contentId;
    Content.delete(contentId,
        (result) => res.send(
            {
                success: true,
                error: null
            }
        ),
        (db_error) => res.send(
            {
                success: false,
                error: db_error
            }
        )
    );
};

exports.createDemoContentForUser = (req, res) => {
    console.log('content.controller::createDemoContentForUser called');

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

    let fs = require('fs');

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
            console.log("content.controller::createContent responding with http success");
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
                            res.send(
                                {
                                    success: true,
                                    error: null
                                });
                        },
                        (dbError) => {
                            console.log("content.controller::createContent responding with http error");
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
            res.send(
                {
                    success: false,
                    error: dbError
                });
        }
    );
};

const Content = require("../models/content.model.js");

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
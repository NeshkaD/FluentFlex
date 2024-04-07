let db = require('./mysql_db.js');

function convertSrtTimestampToMilliseconds(srtTimestampString) {
    let srtTimestampPattern = /(\d\d):(\d\d):(\d\d)[,\.](\d\d\d)/;
    let matchGroups = srtTimestampString.match(srtTimestampPattern);
    let hour = parseInt(matchGroups[1], 10);
    let minute = parseInt(matchGroups[2], 10);
    let second = parseInt(matchGroups[3], 10);
    let milli = parseInt(matchGroups[4], 10);

    let totalMilliseconds = hour * 3600000 + minute * 60000 + second * 1000 + milli; // TODO: test a large timestamp
    return totalMilliseconds;
}

// constructor
const Content = function (content) {
    this.id = content.id;
    this.userId = content.userId;
    this.type = content.type;
    this.language = content.language;
    this.media = content.media;
    this.mediaTitle = content.mediaTitle;
    this.mediaAuther = content.mediaAuthor;
};

// TODO: Reduce nesting in the following method with promises.
// This parameter order has been chosen to match the nodejs mysql API being used. 
Content.createContent = (
    userId, type, contentLanguage, translationLanguage, media, mediaTitle, mediaAuthor, userLanguageSrtArray, foreignLanguageSrtArray, callback, error_callback) => {

    db.beginTransaction((err) => {
        console.log("Began DB transaction");
        if (err) {
            console.log("Error starting DB transaction");
            return db.rollback(() => error_callback(err));
        }
        db.query('INSERT INTO content_item (user_id, type, language, media, media_title, media_author) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, contentLanguage, media, mediaTitle, mediaAuthor],
            (error, result) => {
                if (error) {
                    return db.rollback(() => {
                        console.log(`Failed to create new content_item for user_id ${userId}. Error: ${error}`);
                        error_callback(error);
                    });
                }
                else {
                    let contentItemId = result.insertId
                    console.log(`Created new content_item for userId ${userId} with id ${contentItemId}`);
                    console.log('Inserting srt_item in foreign language');

                    db.query('INSERT INTO srt_item (content_item_id, raw_srt, type, language) VALUES (?, ?, ?, ?)',
                        [contentItemId, null, type, contentLanguage], // TODO: pass raw srt file in
                        (error2, result2) => {
                            if (error2) {
                                return db.rollback(() => {
                                    console.log(`Failed to create new srt_item for userId ${userId} and contentId ${contentItemId}. Error: ${error2}`);
                                    error_callback(error2);
                                });
                            }
                            else {
                                let foreignSrtItemId = result2.insertId
                                console.log(`Created new foreign srt_item for content_item_id ${contentItemId} with id ${foreignSrtItemId}`);
                                console.log('Inserting srt_item in user language');
                                db.query('INSERT INTO srt_item (content_item_id, raw_srt, type, language) VALUES (?, ?, ?, ?)',
                                    [contentItemId, null, type, translationLanguage], // TODO: actually get the user langauge and pass raw srt file in
                                    (error3, result3) => {
                                        if (error3) {
                                            return db.rollback(() => {
                                                console.log(`Failed to create new srt_item for userId ${userId} and contentId ${contentItemId}. Error: ${error3}`);
                                                error_callback(error3);
                                            });
                                        }
                                        else {
                                            let userLanguageSrtItemId = result3.insertId
                                            console.log(`Created new user language srt_item for content_item_id ${contentItemId} with id ${userLanguageSrtItemId}`);
                                            console.log('Preparing to bulk insert srt details');
                                            let bulkInsertArray = []
                                            for (const element of foreignLanguageSrtArray) {
                                                let item = [
                                                    foreignSrtItemId,
                                                    parseInt(element.id, 10),
                                                    convertSrtTimestampToMilliseconds(element.startTime),
                                                    convertSrtTimestampToMilliseconds(element.endTime),
                                                    element.text,
                                                    0,
                                                    0
                                                ];
                                                bulkInsertArray.push(item)
                                            }
                                            for (const element of userLanguageSrtArray) {
                                                let item = [
                                                    userLanguageSrtItemId,
                                                    parseInt(element.id, 10),
                                                    convertSrtTimestampToMilliseconds(element.startTime),
                                                    convertSrtTimestampToMilliseconds(element.endTime),
                                                    element.text,
                                                    0,
                                                    0
                                                ];
                                                bulkInsertArray.push(item)
                                            }
                                            console.log('Performing bulk insert');
                                            db.query('INSERT INTO srt_detail (srt_item_id, line_id, timestamp_start, timestamp_end, line, score, attempts) VALUES ?',
                                                [bulkInsertArray],
                                                (error4, result4) => {
                                                    if (error4) {
                                                        return db.rollback(() => {
                                                            console.log(`Failed to create srtDetails for userId ${userId} and contentId ${contentItemId}. Error: ${error4}`);
                                                            error_callback(error4);
                                                        });
                                                    }
                                                    db.commit((errorCommit) => {
                                                        if (errorCommit) {
                                                            return db.rollback(() => {
                                                                console.log('Error while committing');
                                                                error_callback(errorCommit);
                                                            });
                                                        }
                                                        console.log('Successfully committed transaction!');
                                                        callback(contentItemId);
                                                    });
                                                });
                                        }
                                    });
                            }
                        });

                }
            }
        );
    });
}


// This parameter order has been chosen to match the nodejs mysql API being used. 
Content.findContentById = (contentId, callback, err_callback) => {
    db.query(
        'SELECT * FROM content_item WHERE id = ?', // TODO: check userId to prevent user from requesting content they don't own
        [contentId],
        (error, result) => {
            let error_description = ''
            if (error) {
                error_description = `Error searching for content with contentId ${contentId}: ${error}`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length < 1) {
                error_description = `No content with id ${contentId}.`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length > 1) {
                error_description = `Multiple contents exist with id ${contentId}.`
                console.log(error_description);
                err_callback(error_description);
            }
            else {
                callback(result[0]);
            }
        }
    );
}

// Excludes the audio blob
Content.findContentInfoById = (contentId, callback, err_callback) => {
    db.query(
        'SELECT id, user_id, type, language, media_title, media_author FROM content_item WHERE id = ?', // TODO: check userId to prevent user from requesting content they don't own
        [contentId],
        (error, result) => {
            let error_description = ''
            if (error) {
                error_description = `Error searching for content info with contentId ${contentId}: ${error}`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length < 1) {
                error_description = `No content info with id ${contentId}.`
                console.log(error_description);
                err_callback(error_description);
            }
            else if (result.length > 1) {
                error_description = `Multiple content infos exist with id ${contentId}.`
                console.log(error_description);
                err_callback(error_description);
            }
            else {
                callback(result[0]);
            }
        }
    );
}

// Excludes the audio blob
Content.findContentInfosByUserId = (userId, callback, err_callback) => {
    db.query(
        'SELECT id, user_id, type, language, media_title, media_author FROM content_item WHERE user_id = ?', // TODO: check userId to prevent user from requesting content they don't own
        [userId],
        (error, result) => {
            let error_description = ''
            if (error) {
                error_description = `Error searching for content info with userId ${userId}: ${error}`
                console.log(error_description);
                err_callback(error_description);
            }
            else {
                callback(result);
            }
        }
    );
}

Content.findSrtItemIdsAndInfoByContentId = (contentId, callback) => {
    db.query(
        'SELECT id, type, language FROM srt_item WHERE content_item_id = ?',
        [contentId],
        (error, result) => {
            if (error) {
                console.log(`Failed to get srt_item ids and info for content item ${contentId}. Error: ${error}`);
                callback(result, error);
            }
            else {
                callback(result);
            }
        }
    );
};

Content.findSrtDetailsBySrtItemId = (srtItemId, callback) => {
    db.query(
        'SELECT * FROM srt_detail WHERE srt_item_id = ?',
        [srtItemId],
        (error, result) => {
            if (error) {
                console.log(`Failed to get srt_details for srt_item id ${srtItemId}. Error: ${error}`);
                callback(result, error);
            }
            else {
                callback(result);
            }
        }
    );
};

Content.patchSrtDetailBasedOnAnswer = (srtDetailId, isCorrectAnswer, callback) => {
    if(isCorrectAnswer) {
        db.query(
            'UPDATE srt_detail SET attempts = attempts + 1, score = score + 1 WHERE id = ?',
            [srtDetailId],
            (error, result) => {
                callback(result, error);
            }
        );
    }
    else {
        db.query(
            'UPDATE srt_detail SET attempts = attempts + 1 WHERE id = ?',
            [srtDetailId],
            (error, result) => {
                callback(result, error);
            }
        );
    }
}

Content.delete = (contentId, callback, error_callback) => {
    // Currently relies on CASCADE ON DELETE to delete srt_item and srt_detail rows
    db.query('DELETE FROM content_item WHERE id = ?',
             [contentId],
             (error, result) => {
                if (error) {
                    error_callback(error); // error_callback should be a function that takes the error as an argument and handles it
                }
                else {
                    callback(result);
                }
            });
}

module.exports = Content;

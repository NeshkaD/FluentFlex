let db = require('./mysql_db.js');

// Helper method to convert timestamp format used in the SRT files into a time offset value in milliseconds
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

// Create new entries in the content_item, srt_item, and srt_detail tables to represent a new set of MP3/SRT files uploaded by a user
Content.createContent = (
    userId, type, contentLanguage, translationLanguage, media, mediaTitle, mediaAuthor, userLanguageSrtArray, foreignLanguageSrtArray, callback, error_callback) => {

    // Begin a MySQL transaction to prevent partial completion of insertion steps:
    db.beginTransaction((err) => {
        console.log("Began DB transaction");
        if (err) {
            console.log("Error starting DB transaction");
            return db.rollback(() => error_callback(err));
        }
        // Insert MP3 content into content_item table
        db.query('INSERT INTO content_item (user_id, type, language, media, media_title, media_author) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, type, contentLanguage, media, mediaTitle, mediaAuthor],
            (error, result) => {
                // Rollback changes and end transaction if error occurs:
                if (error) {
                    return db.rollback(() => {
                        console.log(`Failed to create new content_item for user_id ${userId}. Error: ${error}`);
                        error_callback(error);
                    });
                }
                // Insert first SRT file metadata into srt_item table:
                else {
                    let contentItemId = result.insertId
                    console.log(`Created new content_item for userId ${userId} with id ${contentItemId}`);
                    console.log('Inserting srt_item in foreign language');

                    db.query('INSERT INTO srt_item (content_item_id, raw_srt, type, language) VALUES (?, ?, ?, ?)',
                        [contentItemId, null, type, contentLanguage], // TODO: pass raw srt file in
                        (error2, result2) => {
                            // Rollback changes and end transaction if error occurs:
                            if (error2) {
                                return db.rollback(() => {
                                    console.log(`Failed to create new srt_item for userId ${userId} and contentId ${contentItemId}. Error: ${error2}`);
                                    error_callback(error2);
                                });
                            }
                            // Insert second SRT file metadata into srt_item table:
                            else {
                                let foreignSrtItemId = result2.insertId
                                console.log(`Created new foreign srt_item for content_item_id ${contentItemId} with id ${foreignSrtItemId}`);
                                console.log('Inserting srt_item in user language');
                                db.query('INSERT INTO srt_item (content_item_id, raw_srt, type, language) VALUES (?, ?, ?, ?)',
                                    [contentItemId, null, type, translationLanguage], // TODO: actually get the user langauge and pass raw srt file in
                                    (error3, result3) => {
                                        if (error3) {
                                            // Rollback changes and end transaction if error occurs:
                                            return db.rollback(() => {
                                                console.log(`Failed to create new srt_item for userId ${userId} and contentId ${contentItemId}. Error: ${error3}`);
                                                error_callback(error3);
                                            });
                                        }
                                        // Parse the lines from the SRT files and save each line with timestamp info in srt_detail table
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
                                                    // Rollback changes and end transaction if error occurs:
                                                    if (error4) {
                                                        return db.rollback(() => {
                                                            console.log(`Failed to create srtDetails for userId ${userId} and contentId ${contentItemId}. Error: ${error4}`);
                                                            error_callback(error4);
                                                        });
                                                    }
                                                    // Commit changes to end the DB transaction and call the success callback method:
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

/// Retrieve MP3 audio binary (blob) data from database table by content_item id
Content.findContentById = (contentId, callback, err_callback) => {
    // Select row by content_item and call the callback on just the audio binary data:
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

// Retrieve metadata info about MP3 content_item from database table by content_item id without retrieving the audio blob.
Content.findContentInfoById = (contentId, callback, err_callback) => {
    // Select non-blob columns from content_item for the given content_item id
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

// Retrieve metadata info about MP3 content_items that belong to the given user ID without retrieving the audio blobs.
Content.findContentInfosByUserId = (userId, callback, err_callback) => {
    // Select non-blob columns from content_item for the given user id
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

// Retrieve all SRT item IDs and information from srt_item table for a given MP3 content_item id
Content.findSrtItemIdsAndInfoByContentId = (contentId, callback) => {
    // SELECT srt_items from the srt_item table that contain the foreign key content_item_id value specified
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

// Retrieve all SRT lines from srt_detail table for a given SRT file in srt_item table
Content.findSrtDetailsBySrtItemId = (srtItemId, callback) => {
    // Select all SRT file lines from srt_detail table for the SRT file in srt_item table with the given ID:
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

// Increment srt_detail score and attempts columns based on user answer
Content.patchSrtDetailBasedOnAnswer = (srtDetailId, isCorrectAnswer, callback) => {
    // Increment score and attempts if isCorrectAnswer==true
    if(isCorrectAnswer) {
        db.query(
            'UPDATE srt_detail SET attempts = attempts + 1, score = score + 1 WHERE id = ?',
            [srtDetailId],
            (error, result) => {
                callback(result, error);
            }
        );
    }
    // Increment attempts if isCorrectAnswer==false
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

// Delete MP3 content and related SRT info from content_item, srt_item, and srt_detail tables
Content.delete = (contentId, callback, error_callback) => {
    // Delete by content id value. Currently relies on CASCADE ON DELETE to delete srt_item and srt_detail rows too.
    db.query('DELETE FROM content_item WHERE id = ?',
             [contentId],
             (error, result) => {
                // Call error callback if DB failure occurs
                if (error) {
                    error_callback(error); // error_callback should be a function that takes the error as an argument and handles it
                }
                // Call success callback if DB failure occurs
                else {
                    callback(result);
                }
            });
}

module.exports = Content;

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
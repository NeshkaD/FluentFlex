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
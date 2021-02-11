const moment = require("moment");

const formatMessages = (username, message) => {
      return {
            message,
            username,
            time: moment().format("h:mm a"),
      };
};

module.exports = formatMessages;

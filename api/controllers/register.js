var request = require("request");
var parseString = require("xml2js").parseString;

exports.registerCallDisconnect = function(logger) {
  var options = {
    method: "GET",
    url: process.env.codecsManagerAPI + "/codecs/app/feedback"
  };

  request(options, function(error, response, body) {
    if (error) {
      throw error;
    }

    var codecs = JSON.parse(body).codecs;

    for (var codec in codecs) {
      register(codecs[codec], logger);
    }
  });
};

function register(codec, logger) {
  var xml =
    "<Command>" +
    "<HttpFeedback>" +
    '<Register command="True">' +
    "<FeedbackSlot>" +
    process.env.register_slot +
    "</FeedbackSlot>" +
    "<ServerUrl>" +
    process.env.feedback_url +
    process.env.calldisconnect_url +
    "</ServerUrl>" +
    "<Format>JSON</Format>" +
    '<Expression item="1">/Event/CallDisconnect</Expression>' +
    "</Register>" +
    "</HttpFeedback>" +
    "</Command>";

  var options = {
    method: "POST",
    url: "http://" + codec.ip + "/putxml",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(codec.login + ":" + codec.password).toString("base64"),
      "Content-Type": "text/xml"
    },
    body: xml
  };

  request(options, function(error, response, body) {
    if (error) {
      logger.error(error);
      updateCodec(codec, error.message);
      return;
    }

    parseString(body, function(err, result) {
      if (err) {
        logger.error(err);
        updateCodec(codec, body);
        return;
      }

      if (result) {
        if (result.Command.HttpFeedbackRegisterResult[0].$.status === "OK") {
          logger.info(
            "Enregistrement réussi du codec " +
              codec.name +
              " sur l'URL suivante : " +
              process.env.feedback_url +
              process.env.calldisconnect_url
          );
          updateCodec(codec, null);
        } else {
          logger.warn(
            "L'enregistrement du codec " +
              codec.name +
              " a échoué ! Veuillez réessayer après avoir vérifié les erreurs !"
          );
          updateCodec(
            codec,
            "Une erreur est survenue " +
              result.Command.HttpFeedbackRegisterResult[0].$.status
          );
        }
      }
    });
  });
}

function updateCodec(codec, message) {
  var options = {
    method: "PATCH",
    url: process.env.codecsManagerAPI + "/codecs/" + codec._id,
    body: [
      {
        propName: "error",
        value: message
      }
    ],
    json: true
  };

  request(options, function(error, response, body) {
    if (error) {
      throw error;
    }
  });
}

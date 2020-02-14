var mongoose = require("mongoose");
var Codec = mongoose.model("Codecs");
var jsxapi = require("jsxapi");
var request = require("request");

exports.createACodec = (req, res) => {
  var newCodec = new Codec({
    systemName: req.body.systemName,
    macAddress: req.body.macAddress,
    ipAddress: req.body.ipAddress,
    productType: req.body.productType,
    username: req.body.username,
    password: req.body.password,
    firmware: req.body.firmware,
    uri: req.body.uri,
    error: false,
    messageError: null
  });

  newCodec.save((err, call) => {
    if (err) {
      res.send(err);
    }
    res.json(call);
  });
};

exports.updateCodec = (req, res) => {
  Codec.findById(req.body._id, function(err, codec) {
    if (err) {
      res.send(err);
    }

    codec.systemName = req.body.systemName;
    codec.macAddress = req.body.macAddress;
    codec.ipAddress = req.body.ipAddress;
    codec.productType = req.body.productType;
    codec.username = req.body.username;
    codec.password = req.body.password;
    codec.firmware = req.body.firmware;
    codec.uri = req.body.uri;
    codec.error = req.body.error;
    codec.messageError = req.body.messageError;

    codec.save(function(err, updatedCodec) {
      if (err) {
        res.send(err);
      }
      res.send(updatedCodec);
    });
  });
};

exports.deleteCodec = (req, res) => {
  var id = req.params.id;

  Codec.deleteOne({ _id: id }, function(err) {
    if (err) {
      res.send(err);
    }

    res.sendStatus(200);
  });
};

exports.getOneCodec = (req, res) => {
  Codec.findOne({ macAddress: req.params.mac }, function(err, codec) {
    if (err) {
      res.send(err);
    }
    res.json(codec);
  });
};

exports.getCodecs = (req, res) => {
  Codec.find({}, function(err, codecs) {
    if (err) {
      res.send(err);
    }
    res.json(codecs);
  });
};

exports.getDiagnostics = (req, res) => {
  var options = {
    method: "GET",
    url: process.env.codecsManagerAPI + "/codecs/mac/" + req.params.mac
  };

  request(options, function(error, response, body) {
    if (error) {
      res.send(error);
    }

    var codec = JSON.parse(body).codec;

    if (codec) {
      const xapi = jsxapi.connect("ssh://" + codec.ip, {
        username: codec.login,
        password: codec.password
      });

      xapi
        .command("Diagnostics Run", {
          ResultSet: "All"
        })
        .then(diagnostics => {
          console.log(diagnostics);
          res.json(diagnostics);
        })
        .catch(function(error) {
          console.log(error);
          res.send(error);
        });
    }
  });
};

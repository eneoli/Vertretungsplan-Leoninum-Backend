var SecurityService = require("./SecurityService");

exports.getPublicKey = function (req, res) {
  res.send(SecurityService.getPublicKey());
};
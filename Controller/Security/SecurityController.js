var securityService = require("../Security/SecurityService");

exports.encryptCredentials = function (req, res) {
  res.send(securityService.encryptCredentials(JSON.stringify(req.body)));
};


exports.decryptCredentials = function (req, res) {
  securityService.decryptCredentials(req.body.secret);
  res.send(securityService.decryptCredentials(req.body.secret));
};
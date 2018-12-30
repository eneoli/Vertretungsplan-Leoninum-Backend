var fs = require("fs");
var yaml = require("js-yaml");
var config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));
var cryptoNode = require("crypto");

exports.getPublicKey = () => {
  return fs.readFileSync(config.security.publicKey, "utf-8");
};

exports.getPrivateKey = () => {
  return fs.readFileSync(config.security.privateKey, "utf-8");
};


exports.encryptCredentials = (data) => {
  let pubKey = this.getPublicKey();
  let encrypted = cryptoNode.publicEncrypt(pubKey, Buffer.from(data));

  return encrypted.toString("base64");
};

exports.decryptCredentials = (encryptedData) => {
  let decrypted = cryptoNode.privateDecrypt(this.getPrivateKey(), Buffer.from(encryptedData, "base64"));
  return decrypted.toString("utf-8");
};
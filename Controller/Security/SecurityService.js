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
  let encrypted = cryptoNode.publicEncrypt({
    "key": this.getPublicKey(),
    padding: cryptoNode.constants.RSA_PKCS1_PADDING
  }, Buffer.from(data));

  return encrypted.toString("base64");
};

exports.decryptCredentials = (encryptedData) => {
  let decrypted = cryptoNode.privateDecrypt({
    "key": this.getPrivateKey(),
    padding: cryptoNode.constants.RSA_PKCS1_PADDING
  }, Buffer.from(encryptedData, "base64"));

  return decrypted.toString("utf-8");
};
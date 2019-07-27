import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as crypto from 'crypto';

const config = yaml.safeLoad(fs.readFileSync('config.yml', 'utf8'));

export function getPublicKey() {
  return fs.readFileSync(config.security.publicKey, 'utf-8');
}

export function getPrivateKey() {
  return fs.readFileSync(config.security.privateKey, 'utf-8');
}

export function encryptCredentials(data) {
  const encrypted = crypto.publicEncrypt({
    key: this.getPublicKey(),
    padding: crypto.constants.RSA_PKCS1_PADDING,
  }, Buffer.from(data));

  return encrypted.toString('base64');
}

export function decryptCredentials(encryptedData) {
  const decrypted = crypto.privateDecrypt({
    key: this.getPrivateKey(),
    padding: crypto.constants.RSA_PKCS1_PADDING,
  }, Buffer.from(encryptedData, 'base64'));

  return decrypted.toString('utf-8');
}
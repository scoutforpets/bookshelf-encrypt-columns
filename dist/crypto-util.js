'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var Crypto = require('crypto');

exports['default'] = {

  /**
   * Encrypts a value.
   * @param  {string} cipher The cipher used when encrypting.
   * @param  {string} key The key used when encrypting.
   * @param  {string} value The value to be encrypted.
   * @return {string} The encrypted value.
   */
  encrypt: function encrypt(cipher, key, value) {

    var c = Crypto.createCipher(cipher, key);

    var crypted = c.update(value, 'utf8', 'hex');
    crypted += c.final('hex');

    return crypted;
  },

  /**
   * Decrypts a value.
   * @param  {string} cipher The cipher used when decrypting.
   * @param  {string} key The key used when decrypting.
   * @param  {string} value The value to be decrypted.
   * @return {string} The decrypted value.
   */
  decrypt: function decrypt(cipher, key, value) {

    var d = Crypto.createDecipher(cipher, key);

    var deciphered = d.update(value, 'hex', 'utf8');
    deciphered += d.final('utf8');

    return deciphered;
  }

};
module.exports = exports['default'];
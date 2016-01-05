const Crypto = require('crypto');

export default {

  /**
   * Encrypts a value.
   * @param  {string} cipher The cipher used when encrypting.
   * @param  {string} key The key used when encrypting.
   * @param  {string} value The value to be encrypted.
   * @return {string} The encrypted value.
   */
   encrypt: (cipher, key, value) => {

    const c = Crypto.createCipher(cipher, key)

    let crypted = c.update(value, 'utf8', 'hex')
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
   decrypt: (cipher, key, value) => {

    const d = Crypto.createDecipher(cipher, key)

    let deciphered = d.update(value, 'hex', 'utf8')
    deciphered += d.final('utf8');

    return deciphered;
  }

};

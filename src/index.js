const _ = require('lodash'),
      Crypto = require('crypto'),
      CryptoUtil = require('./crypto-util');

/**
 * Export the plugin.
 */
export default (Bookshelf, options) => {

  const Model = Bookshelf.Model.prototype;

  Bookshelf.Model = Bookshelf.Model.extend({

    initialize() {

      if (!this.encryptedColumns) {
        return Model.initialize.apply(this, arguments);
      }

      const defaultOptions = {
        key: null,
        cipher: 'aes-256-ctr'
      };

      let cipherOptions = _.merge(defaultOptions, options);

      // Validate that there is a key and a valid cipher.
      if (!_.contains(Crypto.getCiphers(), cipherOptions.cipher)) {
        throw new Error('Invalid cipher: ' + cipherOptions.cipher);
      }

      if (_.isEmpty(cipherOptions.key)) {
        throw new Error('Invalid key: please specify a key.');
      }

      // Encrypt specified columns on save.
      this.on('saving', () => {
        if (this.encryptedColumns) {
          _.forEach(this.encryptedColumns, (column) => {
            if (this.attributes[column]) {
              this.attributes[column] = CryptoUtil.encrypt(cipherOptions.cipher, cipherOptions.key, this.attributes[column]);
            }
          });
        }
      });

      // Decrypt specified columns when fetching an individual record.
      this.on('fetched', () => {
        if (this.encryptedColumns) {
          _.forEach(this.encryptedColumns, (column) => {
            if (this.attributes[column]) {
              this.attributes[column] = CryptoUtil.decrypt(cipherOptions.cipher, cipherOptions.key, this.attributes[column]);
            }
          });
        }
      });

      // Decrypt specified columns when fetching a collection of records.
      this.on('fetched:collection', (collection) => {
        if (this.encryptedColumns) {
          _.forEach(this.encryptedColumns, (column) => {
            if (!_.isEmpty(collection)) {
              _.forEach(collection.models, (model) => {
                if (model.has(column)) {
                  model.attributes[column] = CryptoUtil.decrypt(cipherOptions.cipher, cipherOptions.key, model.attributes[column]);
                }
              });
            }
          });
        }
      });

      return Model.initialize.apply(this, arguments);
    }
  });
};

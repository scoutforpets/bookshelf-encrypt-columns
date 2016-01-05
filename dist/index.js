'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var _ = require('lodash'),
    Crypto = require('crypto'),
    CryptoUtil = require('./crypto-util');

/**
 * Export the plugin.
 */

exports['default'] = function (Bookshelf, options) {

  var Model = Bookshelf.Model.prototype;

  Bookshelf.Model = Bookshelf.Model.extend({

    initialize: function initialize() {
      var _this = this;

      if (!this.encryptedColumns) {
        return Model.initialize.apply(this, arguments);
      }

      var defaultOptions = {
        key: null,
        cipher: 'aes-256-ctr'
      };

      var cipherOptions = _.merge(defaultOptions, options);

      // Validate that there is a key and a valid cipher.
      if (!_.contains(Crypto.getCiphers(), cipherOptions.cipher)) {
        throw new Error('Invalid cipher: ' + cipherOptions.cipher);
      }

      if (_.isEmpty(cipherOptions.key)) {
        throw new Error('Invalid key: please specify a key.');
      }

      // Encrypt specified columns on create.
      this.on('saving', function (model, attrs, options) {
        if (_this.encryptedColumns) {
          _.forEach(_this.encryptedColumns, function (column) {
            if (_this.attributes[column]) {
              var encrypted = CryptoUtil.encrypt(cipherOptions.cipher, cipherOptions.key, _this.attributes[column]);
              if (_.get(options, 'patch') == true) {
                attrs[column] = encrypted;
              } else {
                _this.attributes[column] = encrypted;
              }
            }
          });
        }
      });

      // Decrypt encrypted columns when fetching an individual record.
      this.on('fetched', function () {
        if (_this.encryptedColumns) {
          _.forEach(_this.encryptedColumns, function (column) {
            if (_this.attributes[column]) {
              _this.attributes[column] = CryptoUtil.decrypt(cipherOptions.cipher, cipherOptions.key, _this.attributes[column]);
            }
          });
        }
      });

      // Decrypt encrypted columns when fetching a collection of records.
      this.on('fetched:collection', function (collection) {
        if (_this.encryptedColumns) {
          _.forEach(_this.encryptedColumns, function (column) {
            if (!_.isEmpty(collection)) {
              _.forEach(collection.models, function (model) {
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

module.exports = exports['default'];
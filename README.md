# bookshelf-encrypt-columns

This [Bookshelf.js](https://github.com/tgriesser/bookshelf) plugin enables you to define which model columns are encrypted on save/update. Those columns will also be automatically decrypted when fetched.

## Installation

Install the package via `npm`:

```sh
$ npm install --save bookshelf-encrypt-columns
```

## Usage

Require and register the `bookshelf-encrypt-columns` plugin:

```js
var bookshelf = require('bookshelf')(knex);
var encryptColumns = require('bookshelf-encrypt-columns');

bookshelf.plugin(encryptColumns, {
  cipher: 'a-valid-cipher',
  key: 'your-strong-key'
});
```

Both `cipher` and `key` are required. By default, the plugin will use the `aes-256-ctr` cipher. For a list of valid ciphers, please see the [Node Crypto docs](https://nodejs.org/api/crypto.html). Be sure to store your `key` in a secure location and avoid passing it to the plugin directly.

Define which columns are encrypted with the `encryptedColumns` prototype property:

```js
bookshelf.Model.extend({
  encryptedColumns: ['secret'],
  tableName: 'test'
});
```

## License

MIT

## Credits
This plugin was inspired by and borrows heavily from the [bookshelf-json-columns](https://github.com/seegno/bookshelf-json-columns) plugin.

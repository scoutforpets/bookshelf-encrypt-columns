import bookshelf from 'bookshelf';
import encryptColumns from '../src/index';
import cryptoUtil from '../src/crypto-util';
import knex from 'knex';
import should from 'should';
import sinon from 'sinon';
import sqlite3 from 'sqlite3';

describe('bookshelf-encrypt-columns', () => {

  let db = new sqlite3.Database('./test.sqlite3');

  const repository = bookshelf(knex({
    client: 'sqlite3',
    connection: {
      filename: "./test.sqlite3"
    }
  }));

  const cipher = 'aes-256-ctr';
  const key = 'GRLz(P2&7R&9C@0';

  const ModelPrototype = repository.Model.prototype;

  repository.plugin(encryptColumns, {
    cipher: cipher,
    key: key
  });

  before(async() => {
    await repository.knex.schema.dropTableIfExists('test');
    await repository.knex.schema.createTable('test', (table) => {
      table.increments('id').primary();
      table.string('secret');
    });
  });

  after(async() => {
    await repository.knex.schema.dropTable('test');
  });

  describe('if an encrypted column is not registered', () => {
    const Model = repository.Model.extend({
      tableName: 'test'
    });

    it('should throw an error on save', async() => {
      try {
        await Model.forge().save({
          secret: ['shh']
        });
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.code.should.equal('22P02');
        e.routine.should.equal('report_parse_error');
      }
    });

    it('should throw an error creating through a collection', async() => {
      const Collection = repository.Collection.extend({
        model: Model
      });
      const collection = Collection.forge();

      try {
        await collection.create(Model.forge({
          secret: ['shh']
        }));
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.code.should.equal('22P02');
        e.routine.should.equal('report_parse_error');
      }
    });

    it('should throw an error on update', async() => {
      const model = await Model.forge().save();

      try {
        await model.save({
          secret: ['shh']
        });
      } catch (e) {
        e.should.be.instanceOf(Error);
        e.code.should.equal('22P02');
        e.routine.should.equal('report_parse_error');
      }
    });

    it('should not override the prototype initialize method', async() => {
      sinon.spy(ModelPrototype, 'initialize');

      await Model.forge().save();

      ModelPrototype.initialize.callCount.should.equal(1);

      sinon.restore(ModelPrototype);
    });
  });

  describe('if an encrypted column is registered', () => {
    const Model = repository.Model.extend({
      encryptedColumns: ['secret'],
      tableName: 'test'
    });

    it('should encrypt the column on save', async(done) => {
      const model = await Model.forge().save({
        secret: 'shh'
      });

      const encrypted = cryptoUtil.encrypt(cipher, key, 'shh');

      db.get('SELECT secret FROM test WHERE id = ?', model.get('id'), (err, row) => {
        row.should.have.property('secret', encrypted);
        done();
      });
    });

    it('should decrypt the column on fetch', async() => {
      const model = await Model.forge().save({
        secret: 'shh'
      });

      await Model.where({ id: model.get('id') })
        .fetch()
        .then((item) => {
          item.get('secret').should.eql('shh');
        });
    });

    it('should encrypt the column when creating through a collection', async(done) => {
      const Collection = repository.Collection.extend({
        model: Model
      });
      const collection = Collection.forge();

      await collection.create(Model.forge({
        secret: 'shh'
      }));

      const encrypted = cryptoUtil.encrypt(cipher, key, 'shh');

      db.get('SELECT secret FROM test WHERE id = (SELECT MAX(ID) FROM test)',  (err, row) => {
        row.should.have.property('secret', encrypted);
        done();
      });
    });

    it('should create a null value on save', async() => {
      const model = await Model.forge().save();

      should(model.get('secret')).be.undefined();
    });

    it('should encrypt the column on update', async(done) => {
      const model = await Model.forge().save();

      await model.save({
        secret: 'monkey'
      });

      const encrypted = cryptoUtil.encrypt(cipher, key, 'monkey');

      db.get('SELECT secret FROM test WHERE id = ?', model.get('id'), (err, row) => {
        row.should.have.property('secret', encrypted);
        done();
      });
    });

    it('should encrypt the column on update when patch is true', async(done) => {
      const model = await Model.forge().save();

      await model.save({
        secret: 'monkey'
      }, {
        patch: true
      });

      const encrypted = cryptoUtil.encrypt(cipher, key, 'monkey');

      db.get('SELECT secret FROM test WHERE id = ?', model.get('id'), (err, row) => {
        row.should.have.property('secret', encrypted);
        done();
      });
    });

    it('should keep a null value on update', async() => {
      const model = await Model.forge().save();

      await model.save();

      should(model.get('secret')).be.undefined();
    });

    it('should not override the prototype initialize method', async() => {
      sinon.spy(ModelPrototype, 'initialize');

      await Model.forge().save();

      ModelPrototype.initialize.callCount.should.equal(1);

      sinon.restore(ModelPrototype);
    });
  });
});

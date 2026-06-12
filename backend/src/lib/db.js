import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, '../../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({
      users: [],
      players: [],
      teams: [],
      matches: [],
      commentaries: []
    }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { users: [], players: [], teams: [], matches: [], commentaries: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockQuery {
  constructor(data, modelName) {
    this._data = data;
    this._modelName = modelName;
  }
  
  select() { return this; }
  
  sort(sortObj) {
    if (!this._data) return this;
    if (sortObj && typeof sortObj === 'object') {
      const field = Object.keys(sortObj)[0];
      const order = sortObj[field];
      const list = Array.isArray(this._data) ? this._data : [this._data];
      list.sort((a, b) => {
        if (a[field] < b[field]) return order === 1 ? -1 : 1;
        if (a[field] > b[field]) return order === 1 ? 1 : -1;
        return 0;
      });
      if (!Array.isArray(this._data)) {
        this._data = list[0];
      }
    }
    return this;
  }
  
  populate(pathStr) {
    if (!this._data || !pathStr) return this;
    const db = readDb();
    
    // If the data is mongoose document(s), convert to plain object(s) first
    // to bypass Mongoose schema casting/validation for populated fields.
    if (Array.isArray(this._data)) {
      this._data = this._data.map(item => (item && typeof item.toObject === 'function') ? item.toObject() : item);
    } else if (this._data && typeof this._data.toObject === 'function') {
      this._data = this._data.toObject();
    }

    const list = Array.isArray(this._data) ? this._data : [this._data];
    
    list.forEach(item => {
      if (!item) return;
      if (this._modelName === 'Team' && pathStr.includes('players')) {
        if (Array.isArray(item.players)) {
          item.players = item.players.map(pId => {
            const idStr = pId && typeof pId === 'object' ? (pId._id || pId).toString() : String(pId);
            return db.players.find(p => p._id === idStr) || pId;
          });
        }
      }
      if (this._modelName === 'Match') {
        if (pathStr.includes('teamA.players') && item.teamA && Array.isArray(item.teamA.players)) {
          item.teamA.players = item.teamA.players.map(pId => {
            const idStr = pId && typeof pId === 'object' ? (pId._id || pId).toString() : String(pId);
            return db.players.find(p => p._id === idStr) || pId;
          });
        }
        if (pathStr.includes('teamB.players') && item.teamB && Array.isArray(item.teamB.players)) {
          item.teamB.players = item.teamB.players.map(pId => {
            const idStr = pId && typeof pId === 'object' ? (pId._id || pId).toString() : String(pId);
            return db.players.find(p => p._id === idStr) || pId;
          });
        }
      }
    });
    
    if (!Array.isArray(this._data)) {
      this._data = list[0];
    }
    return this;
  }
  
  skip(n) {
    if (Array.isArray(this._data)) {
      this._data = this._data.slice(n);
    }
    return this;
  }
  
  limit(n) {
    if (Array.isArray(this._data)) {
      this._data = this._data.slice(0, n);
    }
    return this;
  }
  
  lean() {
    if (this._data) {
      if (Array.isArray(this._data)) {
        this._data = this._data.map(item => (item && typeof item.toObject === 'function') ? item.toObject() : item);
      } else if (typeof this._data.toObject === 'function') {
        this._data = this._data.toObject();
      }
    }
    return this;
  }
  
  then(onResolve, onReject) {
    return Promise.resolve(this._data).then(onResolve, onReject);
  }
  catch(onReject) {
    return Promise.resolve(this._data).catch(onReject);
  }
}

const setupMockDb = () => {
  console.warn('⚠️ MongoDB connection failed or is placeholder. Initializing local JSON Database Mock fallback.');
  
  // Override connection methods
  mongoose.connect = async () => {
    console.log('MongoDB connection skipped. Mock JSON Database active.');
    return { connection: { host: 'local-json-mock' } };
  };

  const getCollectionKey = (modelName) => {
    const map = {
      'User': 'users',
      'Player': 'players',
      'Team': 'teams',
      'Match': 'matches',
      'Commentary': 'commentaries'
    };
    return map[modelName] || (modelName.toLowerCase() + 's');
  };

  const patchModel = (model) => {
    const name = model.modelName;
    const collectionKey = getCollectionKey(name);

    model.prototype.save = async function() {
      const db = readDb();
      const collection = db[collectionKey] || [];
      
      if (!this._id) {
        this._id = new mongoose.Types.ObjectId().toString();
      }
      const index = collection.findIndex(item => item._id === this._id.toString());
      
      const doc = JSON.parse(JSON.stringify(this));
      if (index >= 0) {
        collection[index] = { ...collection[index], ...doc, updatedAt: new Date().toISOString() };
      } else {
        doc.createdAt = new Date().toISOString();
        doc.updatedAt = new Date().toISOString();
        collection.push(doc);
      }
      db[collectionKey] = collection;
      writeDb(db);
      return this;
    };

    model.find = function(filter = {}) {
      const db = readDb();
      let list = db[collectionKey] || [];
      
      if (filter && typeof filter === 'object') {
        list = list.filter(item => {
          for (const key of Object.keys(filter)) {
            if (key === 'isActive' && item.isActive === undefined) {
              const itemVal = item.isActive === false ? false : true;
              if (itemVal !== filter[key]) return false;
              continue;
            }
            if (key === '$or') {
              const matchOr = filter.$or.some(subFilter => {
                const subKey = Object.keys(subFilter)[0];
                const subVal = subFilter[subKey];
                if (subKey.includes('.')) {
                  const parts = subKey.split('.');
                  let current = item;
                  for (const p of parts) {
                    current = current ? current[p] : undefined;
                  }
                  if (Array.isArray(current)) {
                    return current.some(v => (v._id || v).toString() === subVal.toString());
                  }
                  return current?.toString() === subVal.toString();
                }
                return item[subKey]?.toString() === subVal.toString();
              });
              if (!matchOr) return false;
              continue;
            }
            
            let val = filter[key];
            if (val && typeof val === 'object' && val.hasOwnProperty('$in')) {
              if (Array.isArray(item[key])) {
                return item[key].some(v => val.$in.includes(v));
              }
              return val.$in.includes(item[key]);
            }
            
            if (item[key] !== val) {
              if (item[key]?.toString() === val?.toString()) continue;
              return false;
            }
          }
          return true;
        });
      }
      
      return new MockQuery(list, name);
    };

    model.findOne = function(filter = {}) {
      const db = readDb();
      const list = db[collectionKey] || [];
      const found = list.find(item => {
        for (const key of Object.keys(filter)) {
          if (item[key]?.toString() !== filter[key]?.toString()) return false;
        }
        return true;
      });
      
      return new MockQuery(found ? new model(found) : null, name);
    };

    model.findById = function(id) {
      if (!id) return new MockQuery(null, name);
      const db = readDb();
      const list = db[collectionKey] || [];
      const found = list.find(item => item._id === id.toString());
      return new MockQuery(found ? new model(found) : null, name);
    };

    model.create = async function(data) {
      const db = readDb();
      const collection = db[collectionKey] || [];
      
      const docs = Array.isArray(data) ? data : [data];
      const createdDocs = docs.map(d => {
        const doc = {
          _id: new mongoose.Types.ObjectId().toString(),
          ...d,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        collection.push(doc);
        return doc;
      });

      db[collectionKey] = collection;
      writeDb(db);
      return Array.isArray(data) ? createdDocs.map(d => new model(d)) : new model(createdDocs[0]);
    };

    model.findByIdAndUpdate = function(id, update, options = {}) {
      const db = readDb();
      const collection = db[collectionKey] || [];
      const index = collection.findIndex(item => item._id === id?.toString());
      
      if (index === -1) {
        return new MockQuery(null, name);
      }

      let doc = collection[index];
      const updateData = update.$set ? update.$set : update;
      doc = { ...doc, ...updateData, updatedAt: new Date().toISOString() };
      collection[index] = doc;
      db[collectionKey] = collection;
      writeDb(db);

      return new MockQuery(new model(doc), name);
    };

    model.findByIdAndDelete = function(id) {
      const db = readDb();
      const collection = db[collectionKey] || [];
      const index = collection.findIndex(item => item._id === id?.toString());
      
      let deleted = null;
      if (index !== -1) {
        deleted = collection.splice(index, 1)[0];
        db[collectionKey] = collection;
        writeDb(db);
      }
      return new MockQuery(deleted ? new model(deleted) : null, name);
    };

    model.countDocuments = function(filter = {}) {
      return {
        then: function(cb) {
          return model.find(filter).then(list => cb(list.length));
        }
      };
    };
  };

  // Patch all models currently registered in Mongoose
  Object.values(mongoose.models).forEach(patchModel);

  // Intercept any future model creations
  const originalModel = mongoose.model;
  mongoose.model = function(name, schema) {
    const model = originalModel.call(mongoose, name, schema);
    patchModel(model);
    return model;
  };
};

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gully-cricket-hq';
  const isPlaceholder = uri.includes('<cluster>') || uri.includes('<user>') || uri.includes('<password>');
  
  if (isPlaceholder || process.env.USE_MOCK_DB === 'true') {
    console.warn('Using local JSON Database Mock fallback (MongoDB URI is a placeholder or USE_MOCK_DB is true).');
    setupMockDb();
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 1500,
      connectTimeoutMS: 1500,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}. Falling back to local JSON Database.`);
    try {
      await mongoose.disconnect();
    } catch (disErr) {}
    setupMockDb();
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB error: ${err.message}`);
});

export default connectDB;

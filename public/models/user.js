const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema({
    username: {type: String, required :true, max: 100},
    password: {type: String, required :true, max: 100},
    email: {type: String, required :true, max: 100},
    varified: {type: Boolean, required :true, max: 100},
    key: {type: String, required :true, max: 100}
});

module.exports = mongoose.model('User', UserSchema);

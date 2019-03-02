const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let UserSchema = new Schema({
    username: {type: String, required :true, max: 100, unique: true },
    password: {type: String, required :true, max: 100},
    email: {type: String, required :true, max: 100, unique: true},
    varified: {type: Boolean, required :true, max: 100},
    key: {type: String, required :true, max: 100}
});
UserSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', UserSchema);

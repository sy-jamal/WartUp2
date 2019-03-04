const mongoose = require('mongoose');
const Schema = mongoose.Schema;
var uniqueValidator = require('mongoose-unique-validator');

let GameSchema = new Schema({
    start_date: {type: Date,  default: Date.now},
    grid: [Number],
    winner:{type: String, required :true, max: 3}
});

let UserSchema = new Schema({
    username: {type: String, required :true, max: 100, unique: true },
    password: {type: String, required :true, max: 100},
    email: {type: String, required :true, max: 100, unique: true},
    verified: {type: Boolean, required :true, max: 100},
    key: {type: String, required :true, max: 100},
    totalGame:{type: Number, default: 0, required: true},
    human: {type: Number, default: 0, required: true},
    worp: {type: Number, default: 0, required: true},
    tie: {type: Number, default: 0, required: true},
    gameList: [GameSchema]
});
UserSchema.plugin(uniqueValidator);
module.exports = mongoose.model('User', UserSchema);

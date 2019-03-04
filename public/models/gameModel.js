const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let GameSchema = new Schema({
    date: {type: Date,  default: Date.now},
    grid: [Number],
    winner:{type: String, required :true, max: 3}
});

module.exports = mongoose.model('Game', GameSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    transactionId: { type: String, required: true },
    whatever: {type: String}
})

module.exports = mongoose.model('Transaction', transactionSchema);
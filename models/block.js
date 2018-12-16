const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blockSchema = new Schema({
    blockNumber: { type: String, required: true, unique: true, index: true },
    blockType: { type: String, required: true},
    blockHash: { type: String, required: true},
    blockTime: { type: String, required: true},
    blockTxIds: [{type: String, required: true}],
    blockDifficulty: {type: Number, required: true},
    prevBlockHash: { type: String, required: true},
    payedPoS: { type: String, required: true},
    payedMN: { type: String, required: true},
})

module.exports = mongoose.model('Block', blockSchema);
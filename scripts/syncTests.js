/*
Playing around with different approaches / patterns on how to use
the RPC calls with node.
*/

const RpcClient = require('bitcoind-rpc');
const settings = require('../lib/settings');

const config = {
    protocol: 'http',
    user: settings.magwallet.user,
    pass: settings.magwallet.pass,
    host: settings.magwallet.host,
    port: settings.magwallet.port,
};

const rpc = new RpcClient(config);

function getCurrentheight(callback) {
    rpc.getBlockCount((err, res) => {
        if (err) return callback(-1);
        return callback(res.result);
    })
}

function getBlockHash(blockheight, callback) {
    rpc.getBlockHash(blockheight, (err, res) => {
        if (err) return callback(-1);
        return callback(res.result);
    })
}

function getBlock(blockHash, callback) {
    rpc.getBlock(blockHash, 1, (err, res) => {
        if (err) return callback(-1);
        return callback(res.result);
    })
}

function getRawTransaction(txID, callback) {
    rpc.getRawTransaction(txID, 1, (err, res) => {
        if (err) return callback(-1);
        return callback(res.result);
    })
}

/*
// Get last block and information from it
getCurrentheight((cb) => {
    var blockHeight = cb;
    if (blockHeight == -1){
        console.log('blockHeight not available');
        process.exit(1);
    }
    console.log('Block:',blockHeight);

    getBlockHash(blockHeight, cb => {
        var blockHash = cb;
        if (blockHash == -1) {
            console.log('blockHash not available');
            process.exit(1);
        }
        //console.log(blockHash);

        getBlock(blockHash, cb => {
            var blockInfo = cb;
            if (blockInfo == -1){
                console.log('blockInfo not available');
                process.exit(1);
            }
            //console.log(blockInfo);

            getRawTransaction(blockInfo.tx[1], cb => {
                console.log('Payed PoS: ' + cb.vout[1].value + ' / ' + cb.vout[1].scriptPubKey.addresses);
                console.log('Payed Masternode: ' + cb.vout[2].value + ' / ' + cb.vout[2].scriptPubKey.addresses);
            })
        })
    })
});
*/

/*
// This is a recursive function running over the blocks sequentiell
const endBlock = 10005;
function iterate(index){
    if (index == endBlock){
        return finished();
    }
    getBlockHash(index, cb =>{
        //console.log(index+' -> '+cb);
        getBlock(cb, cb => {
            if (cb.tx.length > 1)
            {
                getRawTransaction(cb.tx[1], cb => {
                    if (cb.vout.length > 2) {
                        console.log(index+' Payed PoS: ' + cb.vout[1].value + ' / ' + cb.vout[1].scriptPubKey.addresses);
                        console.log(index+' Payed Masternode: ' + cb.vout[2].value + ' / ' + cb.vout[2].scriptPubKey.addresses);                    
                    }
                })
            }
            iterate(index + 1);
        })
        //iterate(index + 1);
    })
}
function finished(){
    console.log('finished...');
}
iterate(10000);
//////////////////////////////////////////////////////////
*/

/*
////// SPAWN all task at once and wait once all finish --> not possible for IOs/HTTP etc. out of ressources
const blockArray = [5000,5001,5002,5003];
let completed = 0;
blockArray.forEach(block => {
    getBlockHash(block, cb =>{
        console.log(cb);
        if (++completed === blockArray.length){
            finished();
        }
    })
})
function finished(){
    console.log('finished...');
}
/////////////////////////////////////////////////////////
*/

/*
//// SPAWN concurrency amount of task parallel
//const blockArray = [100, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];
const range = (N) => Array.from({ length: N }, (v, k) => k + 1);
const blockArray = range(1000);
let concurrency = 10, running = 0, completed = 0, index = 0;
function next() {
    while (running < concurrency && index < blockArray.length) {
        const block = blockArray[index++];
        getBlockHash(block, cb => { 
            const hash = cb;     
            if (completed === blockArray.length) {
                return finished();
            }
            completed++ , running--;
            next();
            
            console.log (block, running, completed, hash);
        });
        running++;
    }
}
next();
function finished() {
    console.log('finished...');
}
*/

/*
// GET current blockheight and fill array with lastXBlocks
getCurrentheight(cb =>{
    const lastXBlocks = 100;  
    const lastBlock = cb;
    const from = lastBlock-lastXBlocks; // check from last blockHeight - lastXBlocks
    const test = (N) => Array.from({ length: N }, (v, k) => k + from);
    const array = test(lastXBlocks);
    console.log(lastBlock, array);
})
*/

//// SPAWN concurrency amount of task parallel
//const blockArray = [100, 5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008, 5009, 5010];
const range = (N) => Array.from({ length: N }, (v, k) => k + 1);
const blockArray = range(56479);
let concurrency = 10, running = 0, completed = 0, index = 0;
function next() {
    while (running < concurrency && index < blockArray.length) {
        const block = blockArray[index++];
        //process.stdout.write(`${running} / ${completed} |`);
        getBlockHash(block, blockHashCallback => {
            const blockHash = blockHashCallback;

            getBlock(blockHash, blockInfoCallBack => {
                const blockInfo = blockInfoCallBack;

                if (completed === blockArray.length) {
                    return finished();
                }
                completed++ , running--;
                next();

                function batchCall() {
                    blockInfo.tx.forEach(txId => {
                        rpc.getRawTransaction(txId, 1);
                    });
                }

                rpc.batch(batchCall, (err, tx) =>{
                    if (err){
                        return blockInfoCallBack;
                    }
                    let info = "";
                    if (tx.length === 1) {
                        info = "POW: " + tx[0].result.vout[0].scriptPubKey.addresses;
                    }
                    if (tx.length >= 2) {
                        let voutInfo = tx[1].result.vout;
                        info = voutInfo.length;
                        if (voutInfo.length == 2){
                            info = 'PoS: ' + voutInfo[1].scriptPubKey.addresses;
                        }
                        if (voutInfo.length > 2){
                            info = 'PoS: ' + voutInfo[1].scriptPubKey.addresses;
                            info += ' MN: ' + voutInfo[2].scriptPubKey.addresses;
                        }
                    }
                    console.log(`Block ${block}: tx's[${tx.length}] -> ${info}`);
                })
            })
        });
        running++;
    }
}
next();

function finished() {
    console.log('finished...');
}
var RpcClient = require('bitcoind-rpc');
const settings = require('../lib/settings');

const config = {
  protocol: 'http',
  user: settings.magwallet.user,
  pass: settings.magwallet.pass,
  host: settings.magwallet.host,
  port: settings.magwallet.port,
};

if (process.argv.length <= 2) {
  console.log("USAGE:");
  console.log("Create a blockNotify.sh shell script:");
  console.log("-------------------------------------------\x1b[32m");
  console.log("#!/bin/sh");
  console.log("cd <path_to_magPoS_folder>");
  console.log('/usr/bin/node scripts/blockNotify.js "$@"\x1b[0m');
  console.log("-------------------------------------------");
  console.log("Add following line in your mag.conf\x1b[32m");
  console.log("blocknotify=<path_to_shellScript>/blockNotify.sh %s\x1b[0m")
  process.exit(-1);
}

var blockHash = process.argv[2];
var rpc = new RpcClient(config);

rpc.getBlock(blockHash, (err, resBlock) => {
  if (err) {
    console.log(err);
    return;
  }
  if (resBlock.result.tx.length > 1) {
    rpc.getRawTransaction(resBlock.result.tx[1], 1, (err, res) => {
      if (err) {
        console.log(err);
        return;
      }
      if (res.result.vout.length > 2) {
        var ts = Math.round((new Date()).getTime() / 1000);
        console.log('\nBlock:', resBlock.result.height);
        console.log('Payed PoS: ' + res.result.vout[1].value + ' / ' + res.result.vout[1].scriptPubKey.addresses);
        console.log('Payed Masternode: ' + res.result.vout[2].value + ' / ' + res.result.vout[2].scriptPubKey.addresses);
      }
    })
  }
})
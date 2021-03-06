'use strict';var _dataSource = require('../lib/dataSource.js');var _dataSource2 = _interopRequireDefault(_dataSource);
var _Block = require('../services/classes/Block');var _Block2 = _interopRequireDefault(_Block);
var _BlocksBase = require('../lib/BlocksBase');var _BlocksBase2 = _interopRequireDefault(_BlocksBase);
var _cli = require('../lib/cli');
var _util = require('util');var _util2 = _interopRequireDefault(_util);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const hashOrNumber = process.argv[2];
const opt = process.argv[3];
const save = opt === '--save';
const json = opt === '--json';
if (!hashOrNumber) help();
_dataSource2.default.then(db => {
  if (!json) (0, _cli.info)(`Getting block ${hashOrNumber}`);
  getBlock(db, hashOrNumber).then(block => {
    if (json) console.log(JSON.stringify(block));else
    {
      console.log(_util2.default.inspect(block, { showHidden: false, depth: null, colors: true }));
      console.log('');
      (0, _cli.info)(` Get time: ${block.time}ms`);
      if (save) (0, _cli.info)(` Save time: ${block.saved}ms`);
    }
    process.exit(0);
  });
});

async function getBlock(db, hashOrNumber) {
  try {
    let time = getTime();
    let saved = null;
    let block = new _Block2.default(hashOrNumber, new _BlocksBase2.default(db));
    await block.fetch();
    let blockData = block.getData(true);
    time = getTime(time);
    if (save) {
      saved = getTime();
      console.log('Saving Block');
      await block.save();
      saved = getTime(saved);
      console.log('Block Saved');
    }
    return { time, saved, block: blockData };
  } catch (err) {
    console.log(err);
    process.exit(9);
  }
}

function help() {
  const myName = process.argv[1].split('/').pop();
  (0, _cli.info)(`Usage: ${process.argv[0]} ${myName} number|hash|latest [--json | --save ]`);
  process.exit(0);
}

function getTime(t) {
  return Date.now() - (t || 0);
}

process.on('unhandledRejection', err => {
  console.error(err);
  process.exit(9);
});
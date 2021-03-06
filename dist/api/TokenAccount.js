'use strict';Object.defineProperty(exports, "__esModule", { value: true });exports.TokenAccount = undefined;var _DataCollector = require('../lib/DataCollector');
var _utils = require('../lib/utils');
var _bignumber = require('bignumber.js');

class TokenAccount extends _DataCollector.DataCollectorItem {
  constructor(collection, key, parent) {
    super(collection, key, parent);
    this.publicActions = {

      getTokenAccounts: params => {
        const contract = params.contract || params.address;
        if (contract) return this.getPageData({ contract }, params);
      },

      getTokensByAddress: async params => {
        const address = params.address;
        const from = this.parent.Address.db.collectionName;
        if (address) {
          let aggregate = [
          { $match: { address } },
          {
            $lookup: { from, localField: 'contract', foreignField: 'address', as: 'addressesItems' } },

          { $replaceRoot: { newRoot: { $mergeObjects: [{ $arrayElemAt: ['$addressesItems', 0] }, '$$ROOT'] } } },
          { $project: { addressesItems: 0 } }];

          let data = await this.getAggPageData(aggregate, params);
          return data;
        }
      },

      getContractAccount: params => {
        const { address, contract } = params;
        return this.getOne({ address, contract });
      },

      getTokenAccount: async params => {
        const { address, contract } = params;
        const account = await this.getOne({ address, contract });
        return this.parent.addAddressData(contract, account, '_contractData');
      },

      getTokenBalance: async params => {
        const { contract, addresses } = params;
        if (!contract) return;

        let query = {};

        if (addresses) query = this.fieldFilterParse('address', addresses);

        let contractData = await this.parent.getAddress(contract);

        contractData = contractData.data;
        if (!contractData) return;

        let { totalSupply, decimals } = contractData;
        if (!totalSupply) return;

        query.contract = contract;
        let accounts = await this.find(query, null, null, { _id: 0, address: 1, balance: 1 });
        if (accounts) accounts = accounts.data;
        if (!accounts) return;

        let accountsBalance = (0, _utils.bigNumberSum)(accounts.map(account => account.balance));
        totalSupply = new _bignumber.BigNumber(totalSupply);
        let balance = accountsBalance ? totalSupply.minus(accountsBalance) : totalSupply;
        let data = { balance, accountsBalance, totalSupply, decimals

          // send accounts
        };if (addresses) data.accounts = accounts;

        data = this.serialize(data);
        return { data };
      } };

  }}exports.TokenAccount = TokenAccount;exports.default =


TokenAccount;
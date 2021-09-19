App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    // Modern dapp browsers...
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.enable();
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('MemeMarket.json', function(data) {
      var memeMarketArtifact = data;
      App.contracts.MemeMarket = TruffleContract(memeMarketArtifact);
      App.contracts.MemeMarket.setProvider(App.web3Provider);

      web3.eth.getCoinbase(function(err, account) {
        if (err === null) {
          App.account = account;
          console.log('Account: ' + App.account);
        }
      });

      App.refreshBalance();
      // Load memes if on voting page
      // Kind of a messy solution but works for now
      if (window.location.pathname === '/VotePage.html') {
        return App.loadVotingOptions();
      } else if (window.location.pathname === '/MarketPage.html') {
        return App.loadAssets();
      }
    });
  },

  refreshBalance: async function() {
    try {
      const instance = await App.contracts.MemeMarket.deployed();
      const balance = await instance.balances.call(App.account);
      console.log(web3.fromWei(balance, 'ether').toString());
      $('#balance').text('Balance: ' + web3.fromWei(balance, 'ether').toString() + 'M3M');
    } catch(err) {
      console.warn(err);
    }
  },

  loadAssets: async function() {
    try {
      const instance = await App.contracts.MemeMarket.deployed();

      // The following should probably be done with Promise.all
      // To take advantage of the async

      // Load own meme shares
      userAssets = [];
      const ownedShares = await instance.ownedShares.call();
      let i = 0;
      for (const idx of ownedShares) {
        meme = await instance.memes.call(idx.toString());
        amountStaked = await instance.amountStaked.call(idx.toString());
        userAssets.push({
          idx: idx.toString(),
          link: meme[1],
          name: 'Meme uwu',
          amount: amountStaked,
          price: web3.fromWei(Math.floor(meme[2].toString() / 100), 'ether'),
          id: 'sell' + i
        });
        i++;
      }
      loadSellAssets();

      // Load shares for sale
      storeAssets = [];
      const memesLength = await instance.memesLength.call();
      i = 0
      for (let j = 0; i < memesLength; j++) {
        const meme = await instance.memes.call(i);
        if (meme[3].toString() == "0") continue;
        storeAssets.push({
          idx: j,
          link: meme[1],
          name: 'Meme uwu',
          amount: meme[3],
          price: web3.fromWei(Math.floor(meme[2].toString() / 100), 'ether'),
          id: 'buy' + i
        });
        i++;
      }
      loadBuyAssets();

    } catch(err) {
      console.warn(err);
    }
  },


  loadVotingOptions: async function() {
    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.getVotingOptions({from: App.account});
      const memeurls = await instance.getVotingOptions.call({from: App.account});
      // Messy but who cares
      for (var i = 0; i < 4; i++) {
        $('#meme' + i).attr('src', memeurls[i]);
        voteData[i].link = memeurls[i];
      }
      document.getElementById("voteTable").innerHTML = getHTMLTableString(voteData);
      refreshSelection();
    } catch(err) {
      console.warn(err);
    }
  },

  handleUploadMeme: async function() {
    console.log('Submit clicked');
    var memeurl = $('#memeurl').val();
    if (memeurl.substr(0, 8) != "https://") {
      window.alert("Sorry, please enter a link with https://")
      return;
    }

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.uploadMeme(memeurl, {from: App.account});
      await App.refreshBalance();
      window.alert("Your meme has been submitted!")
    } catch(err) {
      console.warn(err);
    }
  },

  handleVote: async function(num) {
    console.log('Voted for meme #' + num);

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.vote(num, {from: App.account});
      // Refresh voting options and balance
      await App.refreshBalance();
      await App.loadVotingOptions();
    } catch(err) {
      console.warn(err);
    }
  },

  handleSell: async function(num) {
    const amount = $('#input' + num).val();
    console.log('Sold ' + amount + ' shares of meme #' + num);

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.sellShares(userAssets[num].idx, amount, {from: App.account});
      await App.refreshBalance();
      await App.loadAssets();
    } catch(err) {
      console.warn(err);
    }
  },

  handleBuy: async function(num) {
    console.log(num);
    const amount = $('#input' + num).val();
    console.log('Bought ' + amount + ' shares of meme #' + num);

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.buyShares(storeAssets[num].idx, amount, {from: App.account});
      await App.refreshBalance();
      await App.loadAssets();
    } catch(err) {
      console.warn(err);
    }
  },

  handleUploadETH: async function() {
    var amount = parseFloat($('#eth_id').val());

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.deposit({from: App.account, value: web3.toWei(amount, 'ether') });
      await App.refreshBalance();
    } catch(err) {
      console.warn(err);
    }
  },

  handleCashOutETH: async function() {
    var amount = $('#m3m_id').val();

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.withdraw(web3.toWei(amount, 'ether'), {from: App.account});
      await App.refreshBalance();
    } catch(err) {
      console.warn(err);
    }
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

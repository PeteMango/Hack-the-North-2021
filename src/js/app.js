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

      // Load memes if on voting page
      // Kind of a messy solution but works for now
      if (window.location.pathname === '/VotePage.html') {
        return App.loadVotingOptions();
      } else if (window.location.pathname === '/HomePage.html') {
        return App.loadAssets();
      }
    });
  },

  loadAssets: async function() {
    try {
      const instance = await App.contracts.MemeMarket.deployed();
      const balance = await instance.balances.call(App.account);
      console.log(balance);
    } catch(err) {
      console.warn(err);
    }
  },


  loadVotingOptions: function() {
    App.contracts.MemeMarket.deployed().then(function(instance) {
      memeMarketInstance = instance;
      return memeMarketInstance.getVotingOptions({from: App.account});
    }).then(function() {
      return memeMarketInstance.getVotingOptions.call({from: App.account});
    }).then(function(memeurls){
      // Messy but who cares
      for (var i = 0; i < 4; i++) {
        $('#meme' + i).attr('src', memeurls[i]);
        voteData[i].link = memeurls[i];
      }
      document.getElementById("voteTable").innerHTML = getHTMLTableString(voteData);
      refreshSelection();
    }).catch(function(error) {
      console.warn(error);
    });
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
    } catch(err) {
      console.warn(err);
    }
  },

  handleUploadETH: async function() {
    var amount = parseInt($('#eth_id').val());

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.deposit({from: App.account, value: web3.toWei(amount, 'ether') });
    } catch(err) {
      console.warn(err);
    }
  },

  handleCashOutETH: async function() {
    var amount = $('#m3m_id').val();

    try {
      const instance = await App.contracts.MemeMarket.deployed();
      await instance.withdraw(web3.toWei(amount, 'ether'), {from: App.account});
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

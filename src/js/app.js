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
      }
    });
  },

  loadVotingOptions: function() {
    App.contracts.MemeMarket.deployed().then(function(instance) {
      memeMarketInstance = instance;
      return memeMarketInstance.getVotingOptions({from: App.account});
    }).then(function(img0, img1, img2, img3) {
      $('#meme0').attr('src', img0);
      $('#meme1').attr('src', img1);
      $('#meme2').attr('src', img2);
      $('#meme3').attr('src', img3);
    }).catch(function(error) {
      console.warn(error);
    });
  },

  handleUploadMeme: function() {
    console.log('Submit clicked');
    var memeurl = $('#memeurl').val();
    if (memeurl.substr(0, 8) != "https://") {
      window.alert("Sorry, please enter a link with https://")
      return;
    }

    var memeMarketInstance;
    App.contracts.MemeMarket.deployed().then(function(instance) {
      memeMarketInstance = instance;
      return memeMarketInstance.uploadMeme(memeurl, {from: App.account});
    }).then(function() {
      window.alert("Your meme has been submitted!")
    }).catch(function(error) {
      console.warn(error);
    });
  },

  handleVote: function(num) {
    console.log('Voted for meme #' + num);

    var memeMarketInstance;
    App.contracts.MemeMarket.deployed().then(function(instance) {
      memeMarketInstance = instance;
      return memeMarketInstance.vote(num, {from: App.account});
    }).then(function() {
      window.alert("Your vote has been cast!")
    }).catch(function(error) {
      console.warn(error);
    });
  },

  handleUploadETH: function() {
    var amount = $('#eth_id').val();

    var memeMarketInstance;
    App.contracts.MemeMarket.deployed().then(function(instance) {
      memeMarketInstance = instance;
      return memeMarketInstance.deposit({from: App.account, value: amount});
    }).catch(function(error) {
      console.warn(error);
    });
  },

  handleCashOutETH: function() {
    var amount = $('#m3m_id').val();

    var memeMarketInstance;
    App.contracts.MemeMarket.deployed().then(function(instance) {
      memeMarketInstance = instance;
      return memeMarketInstance.withdraw(amount, {from: App.account});
    }).catch(function(error) {
      console.warn(error);
    });
  },

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});

var MemeMarket = artifacts.require("./MemeMarket.sol");

module.exports = function(deployer) {
    deployer.deploy(MemeMarket);
};
let config = require(typeof window === 'undefined' ? './configForMain' : './configForRenderer');
module.exports = config;

const ItemEval = require('../pobApi/ItemEval');
let itemEval = new ItemEval();
itemEval.ready.then(() => console.log('ready'))
itemEval.setBuild('C:/Users/manukh/Documents/Path of Building/Builds/traickster brand harvest.xml');
itemEval.evalItemModDpsLife('30% increased Spell Damage').then(a => console.log(a));
itemEval.evalItemModDpsLife('30% increased cast speed').then(a => console.log(a));
itemEval.evalItemModDpsLife('+56 to maximum Life').then(a => console.log(a));
itemEval.evalItemModDpsLife('+51 to maximum Mana').then(a => console.log(a));
itemEval.evalItemModDpsLife('+45% to Lightning Resistance').then(a => console.log(a));
itemEval.evalItem(ItemEval.decode64('UmFyaXR5OiBSYXJlDQpBcG9jYWx5cHNlIENpcmNsZQ0KVG9wYXogUmluZw0KLS0tLS0tLS0NClJlcXVpcmVtZW50czoNCkxldmVsOiA2Mw0KLS0tLS0tLS0NCkl0ZW0gTGV2ZWw6IDc5DQotLS0tLS0tLQ0KKzIwJSB0byBMaWdodG5pbmcgUmVzaXN0YW5jZSAoaW1wbGljaXQpDQotLS0tLS0tLQ0KKzQ3IHRvIFN0cmVuZ3RoDQorNzQgdG8gbWF4aW11bSBMaWZlDQorNDMgdG8gbWF4aW11bSBNYW5hDQo2MyUgaW5jcmVhc2VkIE1hbmEgUmVnZW5lcmF0aW9uIFJhdGUNCg==')).then(a => console.log(a));

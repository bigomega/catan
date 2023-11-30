// Shuffle function taken from: http://stackoverflow.com/a/2450976/3951475
export function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

export function newObject(obj = {}, val = 0) {
  return Object.keys(obj).reduce((mem, k) => (mem[k] = val, mem), {})
}

// Binary to Base64
function encode64(binary) {
  var convert = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  var base64 = "";
  // Pad it
  if (binary.length % 6 !== 0) {
    binary = Array(7 - (binary.length % 6)).join("0") + binary;
  }
  for (var i = 0; i < binary.length / 6; i++) {
    var slice = binary.substr(i*6, 6);
    base64 += convert[parseInt(slice, 2)];
  }
  return base64;
}

// Base64 to binary
function decode64(base64) {
  var convert = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  var binary = "";

  for (var i = 0; i < base64.length; i++) {
    var converted = convert.indexOf(base64[i]).toString(2);
    binary += ("000000" + converted).substring(converted.length)
  }
  return binary;
}

// Board constants
var tileTypes = ["desert", "brick", "lumber", "ore", "sheep", "wheat"];
var shipTypes = ["31", "wheat", "ore", "lumber", "brick", "sheep"];

// Board stuff
class Tile {
  constructor(type, number) {
    this.type = type;
    this.number = number;
  }

  binary() {
    var typeString = tileTypes.indexOf(this.type).toString(2);
    var numString = this.number.toString(2);
    return ("000" + typeString).substring(typeString.length) + ("0000" + numString).substring(numString.length);
  }
}

class Ship {
  constructor(type) {
    this.type = type;
  }

  binary() {
    var typeString = shipTypes.indexOf(this.type).toString(2);
    return ("000" + typeString).substring(typeString.length);
  }
}

class Game {
  constructor(pieces, ships, locs=[]) {
    this.pieces = pieces;
    this.ships = ships;
    this.locs = locs;
  }
}

// Encodes a game into a base64 string
function encode(game) {
  var binary = "";
  if (game.pieces.length == 19 && game.ships.length == 9) {
    for (var i = 0; i < game.pieces.length; i++) {
      binary += game.pieces[i].binary();
    }
    for (var i = 0; i < game.ships.length; i++) {
      binary += game.ships[i].binary();
    }
  }

  return encode64(binary);
}

function encodeMoves(game) {
  var binary = "";
  for (var i = 0; i < 8; i++) {
    if (i < game.locs.length) {
      var numString = game.locs[i].toString(2);
    } else {
      var numString = "111111";
    }
    binary += ("000000" + numString).substring(numString.length);
  }

  return encode64(binary);
}

// Decodes a base64 string into a game
function decode(string) {
  var binary = decode64(string);
  binary = binary.substring(binary.length - (19 * 7 + 3 * 9));

  var pieces = [];
  var ships = [];
  if (binary.length == 19 * 7 + 3 * 9) {
    for (var i = 0; i < 19; i++) {
      var slice = binary.substr(i*7, 7);
      var type = tileTypes[parseInt(slice.slice(0, 3), 2)];
      var num = parseInt(slice.slice(3, 7), 2);
      pieces.push(new Tile(type, num));
    }
    for (var i = 0; i < 9; i++) {
      var slice = binary.substr(19*7 + i*3, 3);
      var type = shipTypes[parseInt(slice, 2)];
      ships.push(new Ship(type));
    }
  }
  return new Game(pieces, ships);
}

// Decodes a base64 string into moves
function decodeMoves(string) {
  var binary = decode64(string);
  binary = binary.substring(binary.length - (6 * 8));

  var locs = [];
  if (binary.length == 6 * 8) {
    for (var i = 0; i < 8; i++) {
      var slice = binary.substr(i*6, 6);
      var num = parseInt(slice, 2);
      if (num != 63) {
        locs.push(num);
      }
    }
  }
  return locs;
}

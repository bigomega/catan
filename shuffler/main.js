// https://alexbeals.com/projects/catan/
var allPieces = ["desert","brick","brick","brick","lumber","lumber","lumber","lumber","ore","ore","ore","sheep","sheep","sheep","sheep","wheat","wheat","wheat","wheat"];
var allProbs = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];

var allShips = ["31", "31", "31", "31", "wheat", "ore", "lumber", "brick", "sheep"];

var moves = ['Red', 'Blue', 'Yellow', 'White', 'White', 'Yellow', 'Blue', 'Red'];
var altMoves = [5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11];
var altOrder = [0, 3, 7, 12, 16, 17, 18, 15, 11, 6, 2, 1, 4, 8, 13, 14, 10, 5, 9];

var adjacent = {
  0: [1, 3, 4],
  1: [0, 2, 4, 5],
  2: [1, 5, 6],
  3: [0, 4, 7, 8],
  4: [0, 1, 3, 5, 8, 9],
  5: [1, 2, 4, 6, 9, 10],
  6: [2, 5, 10, 11],
  7: [3, 8, 12],
  8: [3, 4, 7, 9, 12, 13],
  9: [4, 5, 8, 10, 13, 14],
  10: [5, 6, 9, 11, 14, 15],
  11: [6, 10, 15],
  12: [7, 8, 13, 16],
  13: [8, 9, 12, 14, 16, 17],
  14: [9, 10, 13, 15, 17, 18],
  15: [10, 11, 14, 18],
  16: [12, 13, 17],
  17: [13, 14, 16, 18],
  18: [14, 15, 17],
};

Array.prototype.popRandom = function () {
  return this.splice(Math.floor(Math.random() * this.length), 1);
}

/*
  Generates a game with randomized tiles, but the alphabetical counter-clockwise
  placement technique.  This number order is the same every time, but the tiles
  underneath switch.
 */
function newSpiralGame() {
  var board = shuffle(allPieces);
  var probs = shuffle(allProbs);
  var ships = shuffle(allShips);

  var pieces = [];
  for (var i = 0; i < board.length; i++) {
    pieces.push(new Tile(board[i], 7));
  }

  // Add in the numbers
  var altIndex = 0;
  for (var i = 0; i < altOrder.length; i++) {
    if (pieces[altOrder[i]].type != "desert") {
      pieces[altOrder[i]].number = altMoves[altIndex];
      altIndex += 1;
    }
  }

  var theseShips = [];
  for (var i = 0; i < ships.length; i++) {
    theseShips.push(new Ship(ships[i]));
  }

  return new Game(pieces, theseShips);
}

/*
  Generates a game with randomized tiles, and randomized numbers, but requires
  that no two red tiles are touching using the adjacent mapping dictionary.
 */
function newPseudoRandomGame() {
  var board = shuffle(allPieces);
  var probs = shuffle(allProbs).filter(function(e) {
      return e !== 6 && e != 8;
  });
  var ships = shuffle(allShips);

  var possibilities = [];

  // Put in all of the tiles
  var pieces = [];
  for (var i = 0; i < board.length; i++) {
    pieces.push(new Tile(board[i], 7));
    if (board[i] != "desert") {
      possibilities.push(i);
    }
  }

  // Place the 6's and 8's
  var toPlace = [6, 6, 8, 8];
  for (var i = 0; i < toPlace.length; i++) {
    var pos = possibilities.popRandom();
    pieces[pos].number = toPlace[i];
    possibilities = possibilities.filter(function(e) {
      return !adjacent[pos].includes(e);
    });
  }

  // Place the rest of them
  for (var i = 0; i < board.length; i++) {
    if (board[i] != "desert" && pieces[i].number == 7) {
      pieces[i].number = probs.pop();
    }
  }

  var theseShips = [];
  for (var i = 0; i < ships.length; i++) {
    theseShips.push(new Ship(ships[i]));
  }

  return new Game(pieces, theseShips);
}

/*
  Generates a completely random board.  Anything goes.
 */
function newRandomGame() {
  var board = shuffle(allPieces);
  var probs = shuffle(allProbs);
  var ships = shuffle(allShips);

  var pieces = [];
  for (var i = 0; i < board.length; i++) {
    if (board[i] == "desert") {
      pieces.push(new Tile(board[i], 7));
    } else {
      pieces.push(new Tile(board[i], probs.pop()));
    }
  }

  var theseShips = [];
  for (var i = 0; i < ships.length; i++) {
    theseShips.push(new Ship(ships[i]));
  }

  return new Game(pieces, theseShips);
}

function displayGame(game) {
  var str = "<div id='board'><div id='display'><img class='background' src='./assets/images/background.png'>";

  // Add in all pieces
  for (var i = 0; i < game.pieces.length; i++) {
    var piece = game.pieces[i];
    if ([0, 3, 7, 12, 16].includes(i)) {
      str += "<div class='row'>";
    }
    if (piece.type != "desert") {
      str += "<span class='tile' prob='" + piece.number + "' dots='" + Array((6 - Math.abs(piece.number - 7))+1).join(".") + "' style='background-image: url(\"assets/images/" + piece.type + ".png\"); color: " + ((piece.number == 6 || piece.number == 8) ? "red" : "black") + "'></span>";
    } else {
      str += "<span class='tile' style='background-image: url(\"./assets/images/desert.png\")'></span>";
    }
    if (i == 2 || i == 6 || i == 11 || i == 15 || i == 18) {
      str += "</div>";
    }
  }

  // Add in all of the ships
  for (var i = 0; i < game.ships.length; i++) {
    var ship = game.ships[i];
    str += "<div class='ship-" + i + "'><img src='./assets/images/ships/" + ship.type + ".png'></div>";
  }
  str += "</div><div id='spots'>";

  // Add in all clickable locations
  var temp = '';
  for (var i = 0; i < 54; i++) {
    if ([0, 3, 7, 11, 16, 21, 27, 33, 38, 43, 47, 51].includes(i)) {
      temp += "</div><div class='chunk'>";
    }
    if (game.locs.includes(i)) {
      var pos = game.locs.indexOf(i);
      temp += "<span data-num='" + i + "' class='" + moves[pos].toLowerCase() + (pos < 4 ? " first" : "") + "'></span>";
    } else {
      temp += "<span data-num='" + i + "' class='open'></span>";
    }
  }

  temp = temp.substring(6) + '</div>';
  str += temp + "</div></div>";

  // Add in the helper side view
  str += "<div id='sidebar'>" +
    "<h3>Share</h3>" +
    "<a id='gameid'>Link to Board</a><br>" +
    "<a id='moveid'>Link to Board w/ Moves</a>" +
    "<h4 id='placement'>Red is placing</h4>" +
    "<a id='undo' href='#'>Undo</a><br><br>" +
    "<a href='?gameType=spiral'>Generate New Board</a><br>" +
    "<a href='?gameType=pseudorandom'>Generate Pseudorandom Board</a><br>" +
    "<a href='?gameType=random'>Generate Completely Random Board</a></div>";

  document.body.innerHTML = str;
}

export function newObject(obj = {}, val = 0) {
  return Object.fromEntries(Object.keys(obj).map(k => [k, val]))
}

// Shuffle function taken from: http://stackoverflow.com/a/2450976/3951475
export function shuffle(array) {
  const new_array = array.slice()
  var current_index = new_array.length, temp, random_index
  while (0 !== current_index) { // While there remain elements to shuffle...
    random_index = Math.floor(Math.random() * current_index) // Pick a remaining element...
    current_index -= 1
    temp = new_array[current_index] // And swap it with the current element.
    new_array[current_index] = new_array[random_index]
    new_array[random_index] = temp
  }
  return new_array
}

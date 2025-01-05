# Catan
Free to play multiplayer Catan board game

## Links
**Play Game:** [catan-qvig.onrender.com](https://catan-qvig.onrender.com/login)
> The onrender server goes to sleep on inactivity, if you open the link it might take a few minutes to get the server up

> Open the Browser Console to have control over all the game configs, including mapkey

**Shuffler & Board builder:** [bharathraja.in/catan](https://bharathraja.in/catan)

---

## Local Installation & Running
```bash
npm i
npm start
```
The server will be reachable at [localhost:3000](http://localhost:3000/). You're now ready to play the game…
> I have an `.nvmrc` pointing to node version `v20.10`. Please use at least `v18` and above…

## Game Features
- [x] Design your own map
- [x] 2/3/4 Players
- [x] Build Houses, Roads, and Cities
- [x] Robber Mechanics
- [x] Trade Requests
- [x] Buy and Use Development Cards
- [x] Sounds
- [x] Animations
- [x] Keyboard Shortcuts
- [x] Clear Notification History
- [x] Smart Map Shuffler
- [x] Optional Timer

## Future Ideas
- Browser Notifications
- Optimization (memory[^1], speed, colors)
  - Further modularisation (as of Dec 2024 `model/game.js` is :700 and `public/js/game.js` is :470)
- Join random games
  - Private & public games
- Watch games
- Custom map builder
- Rethink ports
  - multiple in single Sea tile
  - disallow connected edges of land being added as ports
- Introducing 8-player maps
- Social login (w pic and/or just a name/id)
- Discord help (for talking)
- Seafarers expansion (fairly easy one)
- Trade negotiations

## Frameworks
### Major
  - **[ExpressJS](https://expressjs.com/)** for HTTP server
  - **[Socket.io](https://socket.io/)** for WebSocket radio
  - **[VanillaJS](http://vanilla-js.com/)** for Frontend UI

### Minor Libraries
  - [Mustache](https://mustache.github.io/) for rendering JSON data in HTML
  - [nodemon](https://nodemon.io/) for ease of development
  - [random-words](https://github.com/apostrophecms/random-words) for generating game-keys
  - [cookie-parser](https://github.com/expressjs/cookie-parser) for 🤷🏻‍♂️

## MapKey DSL Explanation
The map is decoded from left-to-right and top-to-bottom. There can by any amount of space `\s` and newline `\n` inbetween the rows and tiles. They are ignored by `.trim()`.

#### Board
The board consists of `<Rows>` separated by  a `-` (bottom-left) or `+` (bottom-right) representing its tile-relationship to the previous row.
```js
<Row> ([+|-] <Row>)*
```

#### Row
A `<Row>` consists of one or more `<Tile>` separated by dot `.`.
```js
<Tile> (. <Tile>)*
```
There are two types of Tiles - Resource and Sea.

#### Resource Tile
A Resource tile is represented by its key `<TileKey>` and a number `<Number>` next to it.
```js
<TileKey><Number>
```
```js
// Accepted values:
const TileKey = { G: 'Grassland', J: 'Jungle', C: 'Clay Pit', M: 'Mountain', F: 'Fields', S: 'Sea', D: 'Desert' }
const Number = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12]
```

#### Sea Tile
A Sea tile is represented by `S` and can optionally have one trade.
```js
S<Trade>?
```

#### Trade
A `Trade` is represented by its edge of the Sea tile it's on `<tEdge>`, type `<tType>` and a number `<tRatio>` covered by round braces `()` and split by underscore `_`.
```js
(<tEdge>_<tType><tRatio>)
```
```js
// Accepted values:
const tEdge = {
  tl: 'top_left',     tr: 'top_right',
  l: 'left',                                        r: 'right',
              bl: 'bottom_left',  br: 'bottom_right',
}

const tType = { '*': 'All', S: 'Sheep', L: 'Lumber', B: 'Brick', O: 'Ore', W: 'Wheat' }

const tRatio = [2, 3]

// Example: (tr_W3)
```
#### General Note
- Surrounding your land with the sea is not necessary, but recommended to get the beautiful sea shores.
- The robber will be placed in the last desert found during decoding.

### Example
This configuration…
```js
const config = {
  mapkey: `
                        S  .S(bl_O2)    .S(br_O2)    .S
                      -S .M8         .D          .M8   .S
                    -S .G9    .S           .S       .G9  .S
                  -S .F10 .S         .S          .S    .F10.S
                -S  .S .C11   .S           .S       .C12 .S  .S
              -S  .S .S   .C2        .S          .C3   .S  .S  .S
        -S(r_L2).J6.J5 .J4    .S           .S       .J4  .J5 .J6 .S(l_L2)
              +S  .S .S   .S         .S          .S    .S  .S  .S
  `
}
// Same as writing…
config.mapkey = `S.S(bl_O2).S(br_O2).S-S.M8.D.M8.S-S.G9.S.S.G9.S-S.F10.S.S.S.F10.S-S.S.C11.S.S.C12.S.S-S.S.S.C2.S.C3.S.S.S-S(r_L2).J6.J5.J4.S.S.J4.J5.J6.S(l_L2)+S.S.S.S.S.S.S.S.S`
```
Renders the map…
<img width="900" alt="Screenshot 2024-02-04 at 11 46 20 copy" src="https://github.com/bigomega/catan/assets/2320747/7449040b-2f77-4ba1-beeb-a648af4dea05">

## Status
### In Progress
  ##### Jan '25
  - [ ] Numberless Tiles MapKey (to be filled by game)
  - [ ] Generic Resource Tiles in MapKey (to be filled by game)
  - [ ] Map Builder
  ##### Feb '24
  - [x] ~~Alert history~~
  - [x] ~~Quit game~~
  - [x] ~~Login & waiting room UI rework~~
  - [x] ~~End Game~~
  ##### Jan '24
  - [x] ~~Accessibility (Zoom, Fullscreen, Sound, Shortcuts~~)
  - [x] ~~Opponents UI~~
  - [x] ~~Shuffler~~
  - [x] ~~Longest Road & Largest Army~~
  - [x] ~~Animations (DC, Cost, Build, Dice, Hand)~~
  - [x] ~~Dev Card Actions~~
  - [x] ~~Trade~~
  - [x] ~~Keyboard Shortcuts~~
  - [x] ~~Client Refactor~~
  - [x] ~~Robber~~
  - [x] ~~Basic Turn Actions~~
  - [x] ~~Refactor server-side Game.js~~
  - [x] ~~Page refresh state persistance~~
  - [x] ~~Render Hand~~
  - [x] ~~Distribute resource~~
  - [x] ~~Place second house & road~~
  - [x]  ~~Place first house & road~~
  ##### Dec '23
  - [x] ~~Alert & Notification Messaging~~
  - [x] ~~Timer System~~
  ##### Nov '23
  - [x] ~~Sound Collection~~
  - [x] ~~Waiting Room~~
  ##### Jun '23
  - [x] ~~Socket IO setup~~
  - [x] ~~Render Corners and Edges~~
  - [x] ~~Render Board~~
  - [x] ~~Image and Sprite Collection & Edit~~
  - [x] ~~Login Page~~
  - [x] ~~Simple Server~~
  - [x] ~~Decoding the map from key~~

### Bugs
  - [x] ~~Road into the Sea~~
  - [ ] Development card styling issue in Safari

### Feedback
  - [ ] Initial build - show the built house
  - [ ] ~~Resource animation after dice animation~~
  - [x] Music reminder
  - [x] Can play DevCard after dice, update text
  - [ ] Trade denied/accepted message
  - [x] Remember player name
  - [ ] Timer focus when few seconds left
  - [ ] Game end, new game link
  - [ ] Login splash image quick load
  - [ ] larger screen number fix

[^1]: https://www.ditdot.hr/en/causes-of-memory-leaks-in-javascript-and-how-to-avoid-them

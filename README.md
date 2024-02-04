# Catan
Free to play multiplayer catan style board game

### Install & Run
```bash
npm i
npm start
```

### MapKey
##### Rules
- The map is decoded from **left to right** and **top to bottom**.
- Each `row` is seperated by a `+` or `-` representing its first-tile relationship (bottom-left and bottom-right respectively) to the first-tile of the previous row. `<row> -<row> +<row>`
- Each `Tile` is separated by a `.`(dot) `<Tile>.<Tile>.<Tile>`
- There can by any amount of `\s`(space) and `\n`(newline) between the `row`s and `Tile`s. They are ignored by `.trim()`.
- A Resource tile is represented by its key and should have a `Number` (between 2 and 12) next to it. `<TileKey><Number>`
- A Sea tile (represented by `S`) can optionally have one trade at max. `S(<Trade>)?`
- A `Trade` is represented by it's edge-`tradeEdge` (in relation to its Sea tile), type-`tradeType` and a number `tradeRatio` covered by round braces `()` and split by `_` (underscore). `(<tradeEdge>_<tradeType><tradeRatio>)`
- It's recommended to surround your land with sea (empty or not).

##### Keys
```js
const TileKey = {
  G: 'Grassland',  J: 'Jungle',
  C: 'Clay Pit',   M: 'Mountain',
  F: 'Fields',     S: 'Sea',
  D: 'Desert',
}

const Number = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const tradeEdge = {
  tl: 'top_left',     tr: 'top_right',
  l: 'left',          r: 'right',
  bl: 'bottom_left',  br: 'bottom_right',
}

const tradeTyp = {
  '*': 'All', S: 'Sheep', L: 'Lumber', B: 'Brick', O: 'Ore', W: 'Wheat'
}

const tradeRatio = [2, 3]
```

##### Example
This configuration…
```js
const config ={
  mapkey: `
                    S .S(bl_O2)   .S(br_O2)    .S
                -S .M8        .D          .M8   .S
              -S .G9 .S          .S           .G9 .S
            -S .F10.S         .S          .S    .F10.S
          -S  .S .C11.S          .S           .C12.S  .S
        -S  .S .S  .C2        .S          .C3   .S  .S .S
  -S(r_L2).J6 .J5.J4 .S          .S           .J4.J5  .J6.S(l_L2)
        +S  .S .S  .S         .S          .S    .S  .S .S
`
}
```
Renders the map…

##### Maojor Frameworks
  - **[ExpressJS](https://expressjs.com/)** for HTTP server
  - **[Mustache](https://mustache.github.io/)** for sending server data in HTML
  - **[Socket.io](https://socket.io/)** for websocket activities
  - **[VanillaJS](http://vanilla-js.com/)** for front-end

## Status
### In Progress
  ##### Feb '24
  - [x] Alert history
  - [x] ~~Quit game~~
  - [x] ~~Login & waiting room UI rework~~
  - [x] ~~End Game~~
  ##### Jan '24
  - [x] ~~Accessibility (Zoom, Fullscreen, Sound, Shortcuts~~)
  - [x] ~~Opponents UI~~
  - [x] ~~Shuffler~~
  - [x] ~~Longest Road & Largest Army~~
  - [x] ~~Animations (DC, Cost, Build, Dice, Hand)~~
  - [x] Dev Card Actions
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
### Next Steps
  - [ ] Browser Notifications
  - [ ] Optimization (memory, speed, colors) ([#ref](https://www.ditdot.hr/en/causes-of-memory-leaks-in-javascript-and-how-to-avoid-them))
  - [ ] Trade negotiations
  - [ ] Join random games
    - Private & public game
  - [ ] Watch games

### Bugs
  - [x] ~~Road into the Sea~~

## Future Ideas
- Custom map builder
- Introducing 8 player maps
- Social login (w pic and/or just a name/id)
- Discord help (for talking)
- Seafarers expansion (fairly easy one)

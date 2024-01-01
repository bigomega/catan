import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cookieParser from 'cookie-parser'
import mustacheExpress from 'mustache-express'
import { Server } from "socket.io"
import http from "http"
import Game from "./models/game.js"
import { parse as parseCookie } from "cookie"
import * as CONST from "./public/js/const.js"
// import Board from "./public/js/board.js"

const app = express()
const PORT = process.env.PORT || 3000
const server = http.createServer(app)
const io = new Server(server)
const SESSION_EXPIRE_HOURS = 5

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())
app.engine('html', mustacheExpress())
app.set('view engine', 'html')
app.set('views', __dirname + '/views')

/**
 * @todo random hexval for game ids
 * @todo Move to a db for game state maintenance?
 */
let games_sessions = { next: 1 }

app.get('/', function (req, res) {
  if (req.cookies.game_id && games_sessions[req.cookies.game_id]) {
    res.redirect('/game/' + req.cookies.game_id)
  } else {
    res.redirect('/login')
  }
})

app.get('/game/new', function (req, res) {
  // New Game
  const game = new Game({
    id: games_sessions.next,
    playerName: req.query.name,
    config: CONST.GAME_CONFIG,
    io,
  })
  games_sessions.next++
  res.cookie('game_id', game.id, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  res.cookie('player_id', 1, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  games_sessions[game.id] = game
  // res.send(`<script>window.location.href = "/game/${game.id}"</script>`)
  res.redirect('/game/' + game.id)
})

app.get('/game/:id', function(req, res) {
  const game_id = req.params.id
  if (!game_id || game_id !== req.cookies.game_id || !games_sessions[game_id]) {
    return res.redirect('/login?notice=Game id not found')
  }
  const game = games_sessions[game_id]
  if (!req.cookies.player_id || !game.hasPlayer(req.cookies.player_id)) {
    return res.redirect('/login?notice=Player not found in the game')
  }
  // res.clearCookie('game_id')
  // console.log(game.players.length, game.player_count)
  if (game.players.length < game.player_count) {
    res.render('waiting_room', {
      players: JSON.stringify(game.getAllPlayers()),
      player_count: game.player_count,
      game_id,
    })
    return
  }
  const player = game.getPlayer(req.cookies.player_id)
  res.render('index', {
    game: JSON.stringify(game),
    player: JSON.stringify(player.toJSON(1)),
    opponents: JSON.stringify(game.getOpponentPlayers(player.id).map(_ => _.toJSON())),
  })
})

app.get('/login', function (req, res) {
  const { gameid, name, notice } = req.query
  if(notice) {
    return res.render('login', { notice })
  }
  if (!gameid) {
    return res.render('login')
  }
  if (!games_sessions[gameid]) {
    return res.render('login', { notice: 'Game not found!' })
  }

  // Joining a game
  const game = games_sessions[gameid]
  const player = game.join(name)

  if(!player) {
    return res.redirect('/login?notice=Game is full!')
  }

  res.cookie('game_id', game.id, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  res.cookie('player_id', player.id, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  res.redirect(`/game/${game.id}`)
})

app.get('/logout', function (req, res) {
  res.clearCookie('game_id')
  res.clearCookie('player_id')
  res.redirect('/login')
})

app.get('/all-sessions', function (req, res) {
  const loggable_json = JSON.parse(JSON.stringify(games_sessions))
  // console.log(loggable_json)
  res.json(loggable_json)
})

app.get('/clear-sessions/:id?', function(req, res) {
  if (req.params.id) {
    delete games_sessions[req.params.id]
    return res.redirect('/all-sessions')
  }
  games_sessions = { next: 1 }
  res.redirect('/all-sessions')
})

// io.engine.use((req, res, next) => {
//   next()
// });

io.use((socket, next) => {
  const { game_id, player_id } = parseCookie(socket.handshake.headers.cookie || '')
  socket.join(game_id || 'unroomed')
  next()
});

// SOCKET IO ACTIVITIES
io.on('connection', (socket) => {
  // console.log('User connected - ', socket.id, socket.rooms)

  socket.on(CONST.SOCKET_EVENTS.PLAYER_ONLINE, function(player_id, game_id) {
    const game = games_sessions[game_id]
    game.ready_players[player_id] = 1
    if (Object.keys(game.ready_players).length === game.player_count) {
      game.start()
    }
  })

  /** @todo inform game of the disconnect. pause and continue */
  socket.on('disconnect', () => {
    // console.log('User disconnected - ', socket.id)
  })
})

server.listen(PORT, function(){
  console.log(`Server running on port ${PORT}`)
})

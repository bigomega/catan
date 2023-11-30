import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import cookieParser from 'cookie-parser'
import mustacheExpress from 'mustache-express'
import { Server } from "socket.io"
import http from "http"
import Game from "./models/game.js"
// import Board from "./public/js/board.js"

const app = express()
const PORT = 3000 || process.env.PORT
const server = http.createServer(app)
const io = new Server(server)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())
app.engine('html', mustacheExpress())
app.set('view engine', 'html')
app.set('views', __dirname + '/views')

// TODO: random hexval for game ids
// TODO: Move to a db for game state maintenance?
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
  })
  games_sessions.next++
  res.cookie('game_id', game.id, { maxAge: 86400 * 1000, httpOnly: true })
  res.cookie('player_id', 1, { maxAge: 86400 * 1000, httpOnly: true })
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
  const player = game.getPlayer(req.cookies.player_id)
  if (game.players.length < game.player_count) {
    res.render('waiting_room', {
      players: JSON.stringify(game.getAllPlayers()),
      player_count: game.player_count,
    })
    return
  }
  res.render('index', {
    game: JSON.stringify(game.toJSON()),
    player: JSON.stringify(player),
    other_players: {},
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

  res.cookie('game_id', game.id, { maxAge: 86400 * 1000, httpOnly: true })
  res.cookie('player_id', player.id, { maxAge: 86400 * 1000, httpOnly: true })
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

io.on('connection', (socket) => {
  console.log('User connected - ', socket.id)

  socket.on('disconnect', () => {
    console.log('User disconnected - ', socket.id)
  })

  socket.on('chat message', console.log)
})

server.listen(PORT, function(){
  console.log(`Server running on port ${PORT}`)
})

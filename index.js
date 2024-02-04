import path from 'path'
import { fileURLToPath } from 'url'
import { parse as parseCookie } from "cookie"
import http from "http"
import express from 'express'
import { Server } from "socket.io"
import mustacheExpress from 'mustache-express'
import cookieParser from 'cookie-parser'
import { generate as generateRandomWords } from "random-words"
import Game from "./models/game.js"
import * as CONST from "./public/js/const.js"
import BoardShuffler from "./public/js/board/board_shuffler.js"

const app = express()
const PORT = process.env.PORT || 3000
const server = http.createServer(app)
const io = new Server(server)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())
app.engine('html', mustacheExpress())
app.set('view engine', 'html')
app.set('views', __dirname + '/views')

const SESSION_EXPIRE_HOURS = 5
const API_SALT = process.env.API_SALT || 'cultivate'
/** @todo Move to a db for game state maintenance? */
/** @type {Object.<string, Game>} */
const GAME_SESSIONS = {}

function onGameEnd(id) {
  delete GAME_SESSIONS[id]
}

app.get('/', function (req, res) {
  if (req.cookies.game_id && GAME_SESSIONS[req.cookies.game_id]) {
    res.redirect('/game/' + req.cookies.game_id)
  } else {
    res.redirect('/login')
  }
})

app.get('/game/new', function (req, res) {
  let id
  do { id = generateRandomWords({ min: 2, max: 2, join: '-' }) } while (GAME_SESSIONS[id])
  const { name, players = CONST.GAME_CONFIG.player_count, config: query_config } = req.query
  if (+players < 2 || +players > 4) { return res.redirect('/login?notice=Player count must be between 2 and 4.') }
  let config = Object.assign({}, CONST.GAME_CONFIG, { player_count: +players || 2 })
  try { config = Object.assign(config, JSON.parse(decodeURIComponent(query_config))) } catch(e){}
  config.mapkey = (new BoardShuffler(config.mapkey)).shuffle(config.map_shuffle)
  const pid = Math.floor(Math.random() * config.player_count + 1)
  const game = new Game({
    id, io,
    host: { name, id: pid },
    config,
    onGameEnd: _id => onGameEnd(_id),
  })
  res.cookie('game_id', id, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  res.cookie('player_id', pid, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  GAME_SESSIONS[id] = game
  // res.send(`<script>window.location.href = "/game/${id}"</script>`)
  res.redirect('/game/' + id)
})

app.get('/game/:id', function(req, res) {
  const game_id = req.params.id
  if (!game_id || game_id !== req.cookies.game_id || !GAME_SESSIONS[game_id]) {
    return res.redirect('/login?notice=Game id not found')
  }
  const game = GAME_SESSIONS[game_id]
  if (!req.cookies.player_id || !game.hasPlayer(+req.cookies.player_id)) {
    return res.redirect('/login?notice=Player not found in the game')
  }
  if (game.players.filter(p => p?.id).length < game.player_count) {
    res.render('waiting_room', {
      players: JSON.stringify(game.players),
      player_count: game.player_count,
      game_id,
    })
    return
  }
  const player = game.getPlayer(+req.cookies.player_id)
  res.render('index', {
    game: JSON.stringify(game),
    player: JSON.stringify(player.toJSON(1)),
    opponents: JSON.stringify(game.getOpponents(player.id).map(_ => _.toJSON())),
  })
})

app.get('/login', function (req, res) {
  const { game_id, name, notice } = req.query
  res.clearCookie('game_id')
  res.clearCookie('player_id')
  if (notice) { return res.render('login', { notice }) }
  if (!game_id) { return res.render('login') }
  if (!GAME_SESSIONS[game_id]) {
    return res.render('login', { notice: 'Game not found!' })
  }

  // Joining a game
  const game = GAME_SESSIONS[game_id]
  const player = game.join(name)

  if (!player) {
    return res.redirect('/login?notice=Game is full!')
  }

  res.cookie('game_id', game.id, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  res.cookie('player_id', player.id, { maxAge: SESSION_EXPIRE_HOURS * 60 * 60 * 1000, httpOnly: true })
  res.redirect(`/game/${game.id}`)
})

app.get('/logout', function (req, res) {
  const { game_id, player_id } = req.cookies
  if (game_id && player_id && GAME_SESSIONS[game_id]?.hasPlayer(+player_id)) {
    GAME_SESSIONS[game_id].removePlayer(+player_id)
  }
  res.clearCookie('game_id')
  res.clearCookie('player_id')
  res.redirect('/login')
})

app.get('/api/sessions', function (req, res) {
  if (req.query.salt !== API_SALT) return res.json({})
  const loggable_json = JSON.parse(JSON.stringify(GAME_SESSIONS))
  res.json(loggable_json)
})

app.get('/api/sessions/clear/:id?', function(req, res) {
  if (req.query.salt !== API_SALT) res.json({})
  if (req.params.id) {
    delete GAME_SESSIONS[req.params.id]
    return res.redirect('/all-sessions')
  }
  Object.keys(GAME_SESSIONS).forEach(gid => delete GAME_SESSIONS[gid])
  res.redirect('/api/sessions')
})

const SOCK_INFO = {}
io.on('connection', (socket) => {
  let { game_id, player_id } = parseCookie(socket.handshake.headers.cookie || '')
  player_id = +player_id
  socket.join(game_id || -1)
  // Only setup socket events for the correct game
  GAME_SESSIONS[game_id]?.setUpPlayerSocket(player_id, socket)
  SOCK_INFO[socket.id] = { game_id, player_id }

  socket.on('disconnect', () => {
    const { game_id, player_id } = SOCK_INFO[socket.id]
    GAME_SESSIONS[game_id]?.removePlayerSocket(player_id, socket)
    delete SOCK_INFO[socket.id]
  })
})

server.listen(PORT, function() {
  console.log(`Server running on port ${PORT}`)
})

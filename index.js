import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import { Server } from "socket.io"
import http from "http"
import Game from "./model/game.js"
import Board from "./public/js/board.js"

// console.log(module)

const app = express()
const PORT = 3000 || process.env.PORT
const server = http.createServer(app)
const io = new Server(server)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api', function(req, res){
  res.send('<h1>Hello world</h1>')
})

io.on('connection', (socket) => {
  console.log('a user connected - ', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected - ', socket.id);
  });

  socket.on('chat message', console.log)
});

server.listen(PORT, function(){
  console.log(`Server running on port ${PORT}`)
})

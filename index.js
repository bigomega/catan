const path = require('path')
const express = require('express')
const { Server } = require("socket.io")
const http = require("http")

const app = express()
const PORT = 3000 || process.env.PORT
const server = http.createServer(app)
const io = new Server(server)

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

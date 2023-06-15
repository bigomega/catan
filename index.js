const path = require('path')
const express = require('express')
const app = express()
app.use(express.static(path.join(__dirname, 'public')))

app.get('/api', function(req, res){
  res.send('<h1>Hello world</h1>')
})

var http = require('http').createServer(app)
http.listen(3000, function(){
  console.log('listening on *:3000')
})

var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

let rooms = [{name: 'Waiting Room', count: 0},
            {name: 'Delta', count: 0},
            {name: 'Charlie', count: 0}
            ,{name: 'Dingo', count: 0}]

let players = []

app.get('/',(req,res) => {
    res.sendFile(__dirname+'/index.html')
})

app.get('/debug',(req,res) => {
    res.send({
        users: players,
        rooms
    })
})

io.on('connection', async socket => {
    socket.join(rooms[0].name, () => {
        rooms[0].count += 1
        console.log(`${rooms[0].count} Townsies in ${rooms[0].name}`)
    })
    
    await newConnection(0,socket.id)
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected`)
    })
})

http.listen(3000,() => {
    console.log('Listening on *:3000')
})

newConnection = async (room, socketId) => {
    const player = {
        name: `Townie ${players.length + 1}`,
        room : rooms[0].name,
        socketId
    }
    players.push(player)
    
    console.log(`connected to ${player.room}`)
    console.log(`Welcome to townsies ${player.name}`)
}
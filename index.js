var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

let rooms = [{ name: 'Waiting Room', count: 0 },
{ name: 'Delta', count: 0 },
{ name: 'Charlie', count: 0 }
    , { name: 'Dingo', count: 0 }]

let players = []

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/debug', (req, res) => {
    res.send({
        users: players,
        rooms
    })
})

io.on('connection', async socket => {
    await onRoomConnection(socket, 0)
    await onPlayerCreation(socket.id, 0)
    socket.on('disconnect', async () => {
        await onRoomDisconnect(socket)
    })
})

http.listen(3000, () => {
    console.log('Listening on *:3000')
})

onRoomDisconnect = async (socket) => {
    console.log(`${socket.id} disconnected`)
    players = players.filter(player => {
        if (player.socketId == socket.id) {
            rooms.find(room => {
                if (room.name == player.room) { room.count -= 1 }
            })
            return false
        } else {
            return true
        }
    })
}

onRoomConnection = async (socket, roomIndex) => {
    socket.join(rooms[roomIndex].name, () => {
        rooms[roomIndex].count += 1
        console.log(`${rooms[0].count} Townsies in ${rooms[0].name}`)
    })
}

onPlayerCreation = async (socketId, roomIndex) => {
    const player = {
        name: `Townie ${players.length + 1}`,
        room: rooms[roomIndex].name,
        socketId
    }
    players.push(player)

    console.log(`connected to ${player.room}`)
    console.log(`Welcome to townsies ${player.name}`)
}
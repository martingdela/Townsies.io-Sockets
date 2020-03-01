var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

let rooms = []
let players = []

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

debugGetAllPlayers = () => {
    var Allplayers = []
    for (player in players) {
        Allplayers.push(players[player])
    }
    return Allplayers
}

app.get('/debug', (req, res) => {
    res.send({
        rooms,
        players: debugGetAllPlayers()
    })
})

getRoomToConnect = async () => {
    var room = {}
    // If no rooms exist, create a new room
    if (rooms.length == 0) {
        room.name = uuidv4()
        room.count = 0
        room.open = true
        return rooms.push(room) - 1
    }

    // If rooms exist, check if one is open
    for (const [i, room] of rooms.entries()) {
        if(room.open) { return i }
    }

    //If none is, create a new one
    room.name = uuidv4()
    room.count = 0
    room.open = true
    return rooms.push(room) - 1
}

io.on('connection', async socket => {
    let roomIndex = await getRoomToConnect()
    await onRoomConnection(socket,roomIndex)
    await onPlayerCreation(socket.id, roomIndex)
    socket.on('disconnect', async () => {
        await onRoomDisconnect(socket)
    })

    socket.on('chat message', (msg) => {
        let player = players.find(player => player.socketId == socket.id)
        socket.to(player.room).emit('message', msg)
    })
})

http.listen(3000, () => {
    console.log('Listening on *:3000')
})

onRoomDisconnect = async (socket) => {
    console.log(`${socket.id} disconnected`)
    rooms[players[socket.id].roomIdx].count -= 1
    delete players[socket.id]
}

uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


onRoomConnection = async (socket,index) => {
    socket.join(rooms[index].name, () => {
        rooms[index].count += 1
        if(rooms[index].count >= 15) { rooms[index].open = false }
        console.log(`${rooms[index].count} Townsies in ${rooms[index].name}`)
    })
}

onPlayerCreation = async (socketId, roomIdx) => {
    players[socketId] = {
        name: `Townie ${socketId}`,
        roomIdx
    }
    console.log(`connected to ${rooms[roomIdx].name}`)
    console.log(`Welcome to townsies ${players[socketId].name}`)
}
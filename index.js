var app = require('express')()
var http = require('http').createServer(app)
var io = require('socket.io')(http)

let rooms = []
let players = []
const MAX_PLAYERS_PER_ROOM = 2

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
    // If no rooms exist, create a new room
    if (rooms.length == 0) {
        return createNewRoom()
    }

    // If rooms exist, check if one is open
    for (const [i, room] of rooms.entries()) {
        if(room.open) { return i }
    }

    //If none is, create a new one
    return createNewRoom()
}

createNewRoom = (name) => {
    var room = {}
    room.name = name ? name : uuidv4()
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

    socket.on('chat-message', (msg) => {
        if(msg.substring(0,1) == '/') { return onCommandInput(msg,socket) } 
        socket.to(rooms[players[socket.id].roomIdx].name).emit('message', msg)
    })
})

http.listen(3000, () => {
    console.log('Listening on *:3000')
})

onRoomDisconnect = async (socket) => {
    console.log(`${socket.id} disconnected`)
    onRoomLeaving(socket)
    delete players[socket.id]
}

onRoomLeaving = socket => {
    rooms[players[socket.id].roomIdx].count -= 1
    if (rooms[players[socket.id].roomIdx].count < MAX_PLAYERS_PER_ROOM) { rooms[players[socket.id].roomIdx].open = true }
}

uuidv4 = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

onCommandInput = (msg,socket) => {
    //Remove the first slash
    msg = msg.substring(1,msg.length)
    msg = msg.split(' ')
    if(msg.length < 2) { return console.log(`Expected args (2) got ${msg.length}. Won't parse`)}
    switch(msg[0]) {
        case 'switch':
            console.log(`player is in room: ${players[socket.id].roomIdx}`)
            let idx = -1
            for (const [i, room] of rooms.entries()) {
                if(room.name == msg[1]) { 
                    idx = i
                }
            }
            
            if(idx < 0) { idx = createNewRoom(msg[1]) }
            if(!rooms[idx].open) { return console.log('Room is at capacity')}

            socket.leave(rooms[players[socket.id].roomIdx].name, () => {
                onRoomLeaving(socket)
                onRoomConnection(socket,idx)
                players[socket.id].roomIdx = idx
            })
            break
        case 'nickname':
            players[socket.id].name = msg.slice(1).join(" ")
            break
        default:
            console.log('this command doesnt exist')
    }
}


onRoomConnection = async (socket,index) => {
    socket.join(rooms[index].name, () => {
        rooms[index].count += 1
        if(rooms[index].count >= MAX_PLAYERS_PER_ROOM) { rooms[index].open = false }
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
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const {Server} = require('socket.io');
const io = new Server(server);

app.use('/', express.static(__dirname));
app.use('/favicon.ico', express.static(__dirname+'/images/favicon.ico'));

// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html');
// });

class Player{
    constructor(name, id){
        this.name = name;
        this.id = id;
        this.move = null;
        this.opponent = null;
        this.playing = false;
    }
}

const player = {};

io.on('connection', (socket) => {
    io.to(socket.id).emit("name", socket.id);

    socket.on("entered", name => {
        console.log(`${name} entered the game with ${socket.id}`);
        player[socket.id] = new Player(name, socket.id);
        io.emit('playerList', player);
    });

    socket.on("letsPlay", (opponentId)=>{
        if(player[socket.id].opponent == null){
            player[socket.id].opponent = opponentId;
            if(player[opponentId].opponent!=socket.id)
                io.to(opponentId).emit('matchRequest', socket.id);
        }
        else if(player[socket.id].opponent != null && player[socket.id].opponent != opponentId){
            io.to(player[socket.id].opponent).emit('opponentLeft');
            player[player[socket.id].opponent].opponent = null;
            player[player[socket.id].opponent].playing = false;
            player[socket.id].playing = false;
            io.to(opponentId).emit('matchRequest', socket.id);
            player[socket.id].opponent = opponentId;
            io.emit('playerList', player);
        }
        if(player[opponentId].opponent==socket.id){
            player[socket.id].playing = true;
            player[opponentId].playing = true;
            player[opponentId].move = "X";
            player[socket.id].move = "O";
            io.to(opponentId).emit('yourTurn', "X");
            io.to(socket.id).emit('opponentTurn', "O");
            io.emit('playerList', player);
        }
    })

    socket.on('myMove', (index)=>{
        io.to(player[socket.id].opponent).emit('opponentMove', {move: player[socket.id].move, index: index});
    })


    socket.on('disconnect', ()=>{
        delete player[socket.id];
        io.emit('playerList', player);
    });
});

server.listen(process.env.PORT || 7000, ()=>{
    console.log('listening on port: 7000');
});
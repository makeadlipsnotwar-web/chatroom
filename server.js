const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// "Datenbank" (Im echten Einsatz durch MongoDB/Postgres ersetzen)
const users = {}; 
const rooms = {}; 

io.on('connection', (socket) => {
    // Registrierung & Login (vereinfacht)
    socket.on('auth', ({ username, password }) => {
        if (!users[username]) {
            users[username] = bcrypt.hashSync(password, 8);
        }
        if (bcrypt.compareSync(password, users[username])) {
            socket.username = username;
            socket.emit('auth_success', username);
        } else {
            socket.emit('error_msg', 'Falsches Passwort!');
        }
    });

    // Raum erstellen oder beitreten
    socket.on('join_room', ({ roomName, roomPass }) => {
        if (!rooms[roomName]) {
            rooms[roomName] = roomPass ? bcrypt.hashSync(roomPass, 8) : null;
        }

        const passHash = rooms[roomName];
        if (!passHash || (roomPass && bcrypt.compareSync(roomPass, passHash))) {
            socket.join(roomName);
            socket.currentRoom = roomName;
            socket.emit('joined', roomName);
        } else {
            socket.emit('error_msg', 'Falsches Raum-Passwort!');
        }
    });

    // Nachricht senden
    socket.on('chat_msg', (msg) => {
        if (socket.currentRoom) {
            io.to(socket.currentRoom).emit('msg_rcv', {
                user: socket.username,
                text: msg
            });
        }
    });
});

server.listen(3000, () => console.log('Läuft auf http://localhost:3000'));

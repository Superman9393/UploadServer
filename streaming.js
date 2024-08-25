import express from 'express';
import http from 'http';
import socketIo from 'socket.io-client';


const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5000",
    methods: ["GET", "POST"]
  }
});

let broadcaster;
let viewers = new Set();

io.on('connection', (socket) => {
  socket.on('broadcaster', () => {
    broadcaster = socket.id;
    socket.broadcast.emit('broadcaster');
  });

  socket.on('viewer', () => {
    viewers.add(socket.id);
    socket.to(broadcaster).emit('viewer', socket.id);
    io.emit('viewerCount', viewers.size);
  });

  socket.on('offer', (id, message) => {
    socket.to(id).emit('offer', socket.id, message);
  });

  socket.on('answer', (id, message) => {
    socket.to(id).emit('answer', socket.id, message);
  });

  socket.on('candidate', (id, message) => {
    socket.to(id).emit('candidate', socket.id, message);
  });

  socket.on('disconnect', () => {
    if (socket.id === broadcaster) {
      socket.broadcast.emit('broadcasterDisconnected');
      broadcaster = null;
    }
    if (viewers.has(socket.id)) {
      viewers.delete(socket.id);
      io.emit('viewerCount', viewers.size);
    }
  });
});

const PORT = process.env.PORT || 3003;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
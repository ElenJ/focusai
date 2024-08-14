const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

mongoose.connect('mongodb://localhost:27017/videocall', { useNewUrlParser: true, useUnifiedTopology: true });

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: Date,
  callUrl: String,
});

const Booking = mongoose.model('Booking', bookingSchema);

app.use(express.json());
app.use(express.static('public'));

app.post('/book', async (req, res) => {
  const { name, email, date } = req.body;
  const callUrl = `/call/${new mongoose.Types.ObjectId()}`;
  const booking = new Booking({ name, email, date, callUrl });
  await booking.save();
  res.json({ callUrl });
});

app.get('/call/:id', (req, res) => {
  res.sendFile(__dirname + '/public/call.html');
});

io.on('connection', (socket) => {
  socket.on('join-call', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);

    socket.on('signal', (data) => {
      socket.to(roomId).emit('signal', data);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

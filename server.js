const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB connection setup. MONGODB_URI is a variable stored in render environment
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define schema and model for bookings
const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  date: Date,
  callUrl: String,
});
const Booking = mongoose.model('Booking', bookingSchema);

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Endpoint to create a new booking and generate a call URL
app.post('/book', async (req, res) => {
  try {
    const { name, email, date } = req.body;
    const callUrl = `/call/${new mongoose.Types.ObjectId()}`; // Unique call URL per booking
    const booking = new Booking({ name, email, date, callUrl });
    await booking.save();
    res.json({ callUrl });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve the call HTML page
app.get('/call/:id', (req, res) => {
  res.sendFile(__dirname + '/public/call.html');
});

// Handle socket.io connections
io.on('connection', (socket) => {
  socket.on('join-call', (roomId) => {
    socket.join(roomId); // Join the specific call room
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    // Notify others in the room that a new user has joined
    socket.to(roomId).emit('user-joined', socket.id);

    // Relay signaling data between users
    socket.on('signal', (data) => {
      socket.to(roomId).emit('signal', data);
    });

    // Notify others when a user disconnects
    socket.on('disconnect', () => {
      console.log(`Socket ${socket.id} disconnected from room ${roomId}`);
      socket.to(roomId).emit('user-left', socket.id);
    });
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

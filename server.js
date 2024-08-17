const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


const { MongoClient, ServerApiVersion } = require('mongodb');
//const uri = "mongodb+srv://elenajolkver:<mongoDB_password>@cluster0.drufz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//const uri = process.env.MONGODB_URI || '"mongodb+srv://elenajolkver:<mongoDB_password>@cluster0.drufz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
/// inserted as chatGPT suggested
const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);




mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// mongoose.connect('mongodb://localhost:27017/videocall', { useNewUrlParser: true, useUnifiedTopology: true });

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

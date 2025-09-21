const express = require('express');
const app = express();
const cors = require('cors');

require('dotenv').config();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Rutas
const jugadoresRoutes = require('./routes/jugadores');
const torneosRoutes = require('./routes/torneos');
const llavesRoutes = require('./routes/llaves');
const gruposRoutes = require('./routes/grupos');
app.use('/api/jugadores', jugadoresRoutes);
app.use('/api/torneos', torneosRoutes);
app.use('/api/llaves', llavesRoutes);
app.use('/api/grupos', gruposRoutes);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

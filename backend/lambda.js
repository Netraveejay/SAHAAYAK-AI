const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const schemeRoutes = require('./routes/schemes');
const uploadRoutes = require('./routes/uploads');
const applicationRoutes = require('./routes/applications');
const aiRoutes = require('./routes/ai');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sahaayak AI Backend (AWS Lambda)' });
});

module.exports.handler = serverless(app);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Sahaayak AI Backend running at http://localhost:${PORT}`);
  });
}

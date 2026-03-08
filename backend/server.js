const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const schemeRoutes = require('./routes/schemes');
const uploadRoutes = require('./routes/uploads');
const applicationRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allow frontend on any common dev port (3000, 3004–3010)
const allowedOrigins = ['http://localhost:3000'];
for (let p = 3004; p <= 3010; p++) allowedOrigins.push(`http://localhost:${p}`);
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sahaayak AI Backend' });
});

app.listen(PORT, () => {
  console.log(`Sahaayak AI Backend running at http://localhost:${PORT}`);
});

const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serves your HTML/CSS/JS

// ── Connect to MongoDB ──────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// ── Schemas ─────────────────────────────────────────────────
const subjectSchema = new mongoose.Schema({
  name:     String,
  code:     String,
  teacher:  String,
  type:     String,
  periods:  Number,
  fg:       String,
  bg:       String,
  createdAt: { type: Date, default: Date.now }
});

const timetableSchema = new mongoose.Schema({
  collegeName: String,
  department:  String,
  semester:    String,
  section:     String,
  grid:        mongoose.Schema.Types.Mixed, // stores your 2D array
  subjects:    [subjectSchema],
  createdAt:   { type: Date, default: Date.now }
});

const Timetable = mongoose.model('Timetable', timetableSchema);

// ── Routes ───────────────────────────────────────────────────

// Save a timetable
app.post('/api/timetables', async (req, res) => {
  try {
    const tt = new Timetable(req.body);
    await tt.save();
    res.json({ success: true, id: tt._id, message: 'Timetable saved!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get all saved timetables
app.get('/api/timetables', async (req, res) => {
  try {
    const list = await Timetable.find({}, 'collegeName department semester section createdAt');
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get one timetable by ID
app.get('/api/timetables/:id', async (req, res) => {
  try {
    const tt = await Timetable.findById(req.params.id);
    if (!tt) return res.status(404).json({ error: 'Not found' });
    res.json(tt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a timetable
app.delete('/api/timetables/:id', async (req, res) => {
  try {
    await Timetable.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start Server ─────────────────────────────────────────────
app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT}`);
});
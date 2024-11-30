const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.redirect('/auth');
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'auth', 'auth.html'));
});

app.get('/main', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'main', 'main.html'));
});

// Handle 404s by redirecting to auth page
app.use((req, res) => {
    res.redirect('/auth');
});

const port = process.env.PORT || 2048;
app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});
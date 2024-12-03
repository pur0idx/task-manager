import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

app.get('/archive', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'archive', 'archive.html'));
});

// Handle 404s by redirecting to auth page
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const port = process.env.PORT || 2048;
app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});
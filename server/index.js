require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// File Parsers
const pdfTodotxt = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('office-text-extractor');

// AI
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

// --- AI HELPER ---
async function extractText(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfTodotxt(dataBuffer);
        return data.text;
    }
    else if (ext === '.docx') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }
    else if (ext === '.pptx') {
        const text = await officeParser.getText(filePath);
        return text;
    }
    else if (ext === '.ipynb') {
        const content = fs.readFileSync(filePath, 'utf8');
        const json = JSON.parse(content);
        let text = "";
        json.cells.forEach(cell => {
            if (cell.cell_type === 'markdown' || cell.cell_type === 'code') {
                text += cell.source.join('') + "\n";
            }
        });
        return text;
    }
    else if (ext === '.txt') {
        return fs.readFileSync(filePath, 'utf8');
    }
    return "";
}

// --- ENDPOINTS ---

app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).send('No file.');
    const protocol = req.protocol;
    const host = req.get('host');
    res.json({ url: `${protocol}://${host}/uploads/${req.file.filename}` });
});

app.post('/generate-quiz', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Server missing GEMINI_API_KEY in .env' });

        const numQuestions = req.body.numQuestions || 5;
        const text = await extractText(req.file.path, req.file.mimetype);

        // Clean up text slightly to avoid token limits if massive
        const truncatedText = text.substring(0, 30000); // Reasonable limit for Free tier

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            Analyze the following text and generate ${numQuestions} multiple-choice questions (MCQs) suitable for a quiz.
            Return ONLY a valid JSON array. Do not include markdown formatting (like \`\`\`json).
            Each object in the array should look like this:
            {
                "text": "Question text here",
                "time": 20,
                "options": [
                    { "text": "Option A", "isCorrect": false },
                    { "text": "Option B", "isCorrect": true },
                    { "text": "Option C", "isCorrect": false },
                    { "text": "Option D", "isCorrect": false }
                ]
            }
            
            TEXT TO ANALYZE:
            ${truncatedText}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let jsonString = response.text();

        // Cleanup potential markdown formatting
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

        const questions = JSON.parse(jsonString);

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({ questions });

    } catch (error) {
        console.error("AI Gen Error:", error);
        res.status(500).json({ error: error.message || 'Failed to generate quiz' });
    }
});


// --- GAME LOGIC ---
const games = {};
const generatePin = () => {
    let pin = Math.floor(100000 + Math.random() * 900000).toString();
    while (games[pin]) pin = Math.floor(100000 + Math.random() * 900000).toString();
    return pin;
};

io.on('connection', (socket) => {
    console.log('Connected:', socket.id);

    socket.on('create_game', (questions) => {
        const pin = generatePin();
        games[pin] = { hostId: socket.id, players: [], status: 'lobby', questions, currentQuestion: 0, answers: {}, questionStartTime: 0 };
        socket.join(pin);
        socket.emit('game_created', pin);
    });

    socket.on('start_game', (pin) => {
        const game = games[pin];
        if (game && game.hostId === socket.id) {
            game.status = 'question';
            io.to(pin).emit('game_started');
            const q = game.questions[game.currentQuestion];
            game.questionStartTime = Date.now();
            io.to(pin).emit('new_question', { question: q.text, imageUrl: q.imageUrl, options: q.options.map(o => o.text), time: q.time });
        }
    });

    socket.on('next_question', (pin) => {
        const game = games[pin];
        if (game && game.hostId === socket.id) {
            game.currentQuestion++;
            if (game.currentQuestion < game.questions.length) {
                game.status = 'question';
                const q = game.questions[game.currentQuestion];
                game.questionStartTime = Date.now();
                io.to(pin).emit('new_question', { question: q.text, imageUrl: q.imageUrl, options: q.options.map(o => o.text), time: q.time });
            } else {
                game.status = 'game_over';
                io.to(pin).emit('game_over', game.players.sort((a, b) => b.score - a.score));
            }
        }
    });

    socket.on('show_results', (pin) => {
        const game = games[pin];
        if (game && game.hostId === socket.id) {
            game.status = 'results';
            io.to(pin).emit('round_results', { leaderboard: game.players.sort((a, b) => b.score - a.score), correctAnswer: game.questions[game.currentQuestion].options.findIndex(o => o.isCorrect) });
        }
    });

    socket.on('join_game', ({ pin, name }) => {
        const game = games[pin];
        if (game && game.status === 'lobby') {
            game.players.push({ id: socket.id, name, score: 0 });
            socket.join(pin);
            io.to(pin).emit('player_joined', game.players);
            socket.emit('joined_success', { pin, name });
        } else socket.emit('error', 'Game not found');
    });

    socket.on('submit_answer', ({ pin, answerIdx }) => {
        const game = games[pin];
        if (game && game.status === 'question') {
            const qIdx = game.currentQuestion;
            if (!game.answers[qIdx]) game.answers[qIdx] = {};
            if (game.answers[qIdx][socket.id] !== undefined) return;

            game.answers[qIdx][socket.id] = answerIdx;
            const q = game.questions[qIdx];
            if (q.options[answerIdx].isCorrect) {
                const timeTaken = (Date.now() - game.questionStartTime) / 1000;
                let points = Math.round(1000 * (1 - (timeTaken / q.time) / 2));
                if (points < 0) points = 0;
                const p = game.players.find(p => p.id === socket.id);
                if (p) p.score += points;
            }
            io.to(game.hostId).emit('answer_received', { count: Object.keys(game.answers[qIdx]).length });
        }
    });

    socket.on('send_reaction', ({ pin, emoji }) => {
        const game = games[pin];
        if (game && game.hostId) io.to(game.hostId).emit('player_reaction', { emoji, playerId: socket.id });
    });

    socket.on('disconnect', () => { });
});

// Serve Frontend
const clientPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientPath)) {
    app.use(express.static(clientPath));
    app.get(/(.*)/, (req, res) => res.sendFile(path.join(clientPath, 'index.html')));
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));

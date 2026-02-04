const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload dir exists
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Upload Endpoint
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
});

// --- GAME LOGIC START ---
const games = {};
const generatePin = () => {
    let pin = Math.floor(100000 + Math.random() * 900000).toString();
    while (games[pin]) {
        pin = Math.floor(100000 + Math.random() * 900000).toString();
    }
    return pin;
};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create_game', (questions) => {
        const pin = generatePin();
        games[pin] = {
            hostId: socket.id,
            players: [],
            status: 'lobby',
            questions: questions,
            currentQuestion: 0,
            answers: {},
            questionStartTime: 0
        };
        socket.join(pin);
        socket.emit('game_created', pin);
        console.log(`Game created with PIN: ${pin}`);
    });

    socket.on('start_game', (pin) => {
        const game = games[pin];
        if (game && game.hostId === socket.id) {
            game.status = 'question';
            io.to(pin).emit('game_started');

            const question = game.questions[game.currentQuestion];
            game.questionStartTime = Date.now();

            io.to(pin).emit('new_question', {
                question: question.text,
                imageUrl: question.imageUrl,
                options: question.options.map(o => o.text),
                time: question.time
            });
        }
    });

    socket.on('next_question', (pin) => {
        const game = games[pin];
        if (game && game.hostId === socket.id) {
            game.currentQuestion++;
            if (game.currentQuestion < game.questions.length) {
                game.status = 'question';
                const question = game.questions[game.currentQuestion];
                game.questionStartTime = Date.now();

                io.to(pin).emit('new_question', {
                    question: question.text,
                    imageUrl: question.imageUrl,
                    options: question.options.map(o => o.text),
                    time: question.time
                });
            } else {
                game.status = 'game_over';
                const leaderboard = game.players.sort((a, b) => b.score - a.score);
                io.to(pin).emit('game_over', leaderboard);
            }
        }
    });

    socket.on('show_results', (pin) => {
        const game = games[pin];
        if (game && game.hostId === socket.id) {
            game.status = 'results';
            const leaderboard = game.players.sort((a, b) => b.score - a.score);
            io.to(pin).emit('round_results', {
                leaderboard,
                correctAnswer: game.questions[game.currentQuestion].options.findIndex(o => o.isCorrect)
            });
        }
    });

    socket.on('join_game', ({ pin, name }) => {
        console.log(`Player ${name} joining game ${pin}`);
        const game = games[pin];
        if (game && game.status === 'lobby') {
            const player = { id: socket.id, name, score: 0 };
            game.players.push(player);
            socket.join(pin);
            io.to(pin).emit('player_joined', game.players);
            socket.emit('joined_success', { pin, name });
        } else {
            socket.emit('error', 'Game not found or already started');
        }
    });

    socket.on('submit_answer', ({ pin, answerIdx }) => {
        const game = games[pin];
        if (game && game.status === 'question') {
            const questionIdx = game.currentQuestion;
            if (!game.answers[questionIdx]) game.answers[questionIdx] = {};
            if (game.answers[questionIdx][socket.id] !== undefined) return;

            game.answers[questionIdx][socket.id] = answerIdx;
            const question = game.questions[questionIdx];
            const isCorrect = question.options[answerIdx].isCorrect;

            if (isCorrect) {
                const now = Date.now();
                const timeTaken = (now - game.questionStartTime) / 1000;
                const totalTime = question.time;
                let points = Math.round(1000 * (1 - (timeTaken / totalTime) / 2));
                if (points < 0) points = 0;
                const player = game.players.find(p => p.id === socket.id);
                if (player) player.score += points;
            }

            const answerCount = Object.keys(game.answers[questionIdx]).length;
            io.to(game.hostId).emit('answer_received', { count: answerCount });
        }
    });

    socket.on('send_reaction', ({ pin, emoji }) => {
        const game = games[pin];
        if (game && game.hostId) {
            io.to(game.hostId).emit('player_reaction', { emoji, playerId: socket.id });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});
// --- GAME LOGIC END ---


// SERVE FRONTEND (Production)
// 1. Client must be built to /server/public or using ../client/dist
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
    console.log('Serving static files from client/dist');
    app.use(express.static(clientDistPath));
    // Catch-all to support React Router
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
} else {
    console.log('Client build not found. Run "npm run build" in client/ first if deploying.');
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Users, Play, ChevronRight, Plus, Trash2, Medal, Image as ImageIcon } from 'lucide-react';

export default function Host() {
    const socket = useSocket();
    const [gamePin, setGamePin] = useState(null);
    const [players, setPlayers] = useState([]);
    const [status, setStatus] = useState('setup');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answerCount, setAnswerCount] = useState(0);
    const [leaderboard, setLeaderboard] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [reactions, setReactions] = useState([]);

    // Question Creator State
    const [questions, setQuestions] = useState([
        {
            text: "",
            imageUrl: "",
            time: 20,
            options: [
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
                { text: "", isCorrect: false },
            ]
        }
    ]);

    useEffect(() => {
        if (!socket) return;
        socket.on('game_created', (pin) => { setGamePin(pin); setStatus('lobby'); });
        socket.on('player_joined', (updated) => setPlayers(updated));
        socket.on('player_reaction', ({ emoji, playerId }) => {
            const id = Date.now() + Math.random();
            setReactions(prev => [...prev, { id, emoji, left: Math.random() * 80 + 10 }]);
            setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 2000);
        });
        socket.on('new_question', (q) => {
            setStatus('question');
            setCurrentQuestion(q);
            setAnswerCount(0);
            setTimeLeft(q.time);
        });
        socket.on('answer_received', ({ count }) => setAnswerCount(count));
        socket.on('round_results', ({ leaderboard }) => { setStatus('results'); setLeaderboard(leaderboard); });
        socket.on('game_over', (finalLeaderboard) => { setStatus('game_over'); setLeaderboard(finalLeaderboard); });

        return () => {
            socket.off('game_created');
            socket.off('player_joined');
            socket.off('player_reaction');
            socket.off('new_question');
            socket.off('answer_received');
            socket.off('round_results');
            socket.off('game_over');
        };
    }, [socket]);

    useEffect(() => {
        if (status === 'question' && timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (status === 'question' && timeLeft === 0) {
            handleShowResults();
        }
    }, [status, timeLeft]);

    const handleFileUpload = async (e, qIdx) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            // Dynamic upload URL
            // In Production (Render), we use relative path '/upload'
            // In Dev (Vite), we use full URL with port 3000
            const isProduction = import.meta.env.PROD;
            const uploadUrl = isProduction
                ? '/upload'
                : `http://${window.location.hostname}:3000/upload`;

            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            updateQuestion(qIdx, 'imageUrl', data.url);
        } catch (err) {
            console.error("Upload failed", err);
            alert("Upload failed. Make sure server is running.");
        }
    };

    const addQuestion = () => {
        setQuestions([...questions, {
            text: "", imageUrl: "", time: 20,
            options: [
                { text: "", isCorrect: false }, { text: "", isCorrect: false },
                { text: "", isCorrect: false }, { text: "", isCorrect: false }
            ]
        }]);
    };

    const removeQuestion = (idx) => {
        if (questions.length > 1) setQuestions(questions.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx, field, value) => {
        const newQuestions = [...questions];
        newQuestions[idx][field] = value;
        setQuestions(newQuestions);
    };

    const updateOption = (qIdx, oIdx, field, value) => {
        const newQuestions = [...questions];
        newQuestions[qIdx].options[oIdx][field] = value;
        if (field === 'isCorrect' && value === true) {
            newQuestions[qIdx].options.forEach((o, i) => { if (i !== oIdx) o.isCorrect = false; });
        }
        setQuestions(newQuestions);
    };

    const handleCreateGame = () => {
        const isValid = questions.every(q => q.text.trim() && q.options.some(o => o.isCorrect));
        if (!isValid) { alert("Please check questions."); return; }
        socket.emit('create_game', questions);
    };

    const handleStartGame = () => socket.emit('start_game', gamePin);
    const handleNextQuestion = () => socket.emit('next_question', gamePin);
    const handleShowResults = () => socket.emit('show_results', gamePin);

    const renderReactions = () => (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {reactions.map(r => (
                <div key={r.id} className="absolute bottom-0 text-6xl animate-floatUp" style={{ left: `${r.left}%` }}>{r.emoji}</div>
            ))}
        </div>
    );

    if (status === 'setup') {
        return (
            <div className="flex flex-col items-center min-h-screen bg-slate-100 p-8 overflow-y-auto">
                <div className="w-full max-w-4xl">
                    <h2 className="text-3xl font-black mb-6 text-nst-primary">Create Your Quiz</h2>
                    {questions.map((q, qIdx) => (
                        <div key={qIdx} className="bg-white p-6 rounded-2xl shadow-lg mb-8">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-gray-500">Question {qIdx + 1}</h3>
                                {questions.length > 1 && (
                                    <button onClick={() => removeQuestion(qIdx)} className="text-red-500 hover:bg-red-50 p-2 rounded"><Trash2 size={20} /></button>
                                )}
                            </div>
                            <input type="text" placeholder="Enter question..." value={q.text} onChange={(e) => updateQuestion(qIdx, 'text', e.target.value)} className="w-full text-lg font-bold p-3 border-2 border-gray-200 rounded-lg mb-4 focus:border-nst-primary outline-none" />

                            {/* File Upload API */}
                            <div className="mb-6">
                                <label className="flex items-center gap-2 cursor-pointer w-fit px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                                    <ImageIcon size={18} />
                                    {q.imageUrl ? 'Change Image' : 'Attach Image'}
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, qIdx)} />
                                </label>
                                {q.imageUrl && <div className="mt-2"><img src={q.imageUrl} alt="Preview" className="h-48 object-contain rounded-lg border bg-gray-50" /></div>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {q.options.map((option, oIdx) => (
                                    <div key={oIdx} className="flex flex-col gap-2">
                                        <div className={`p-1 rounded-lg ${oIdx === 0 ? 'bg-kahoot-red' : oIdx === 1 ? 'bg-kahoot-blue' : oIdx === 2 ? 'bg-kahoot-yellow' : 'bg-kahoot-green'}`}>
                                            <div className="flex items-center bg-white rounded p-2 gap-2">
                                                <input type="radio" checked={option.isCorrect} onChange={(e) => updateOption(qIdx, oIdx, 'isCorrect', e.target.checked)} className="w-6 h-6 accent-green-600" />
                                                <input type="text" placeholder={`Option ${oIdx + 1}`} value={option.text} onChange={(e) => updateOption(qIdx, oIdx, 'text', e.target.value)} className="w-full font-medium outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    <div className="flex gap-4 mb-12">
                        <button onClick={addQuestion} className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition-colors"><Plus size={20} /> Add Question</button>
                        <button onClick={handleCreateGame} className="flex-1 px-6 py-3 bg-kahoot-purple text-white font-bold rounded-lg shadow-[0_6px_0_rgb(50,20,100)] active:shadow-none active:translate-y-[6px] transition-all">Done & Create Game</button>
                    </div>
                </div>
            </div>
        );
    }

    // ... (Lobby and Question similar to before, just short to fit context if needed, but I will include full code for safety)
    if (status === 'lobby') {
        return (
            <div className="flex flex-col min-h-screen bg-gradient-to-br from-nst-dark to-kahoot-purple overflow-hidden relative">
                {renderReactions()}
                <div className="p-8 flex justify-between items-start z-10">
                    <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl text-white">
                        <div className="text-sm font-bold opacity-70">GAME PIN:</div>
                        <div className="text-6xl font-black tracking-widest">{gamePin}</div>
                    </div>
                    <button onClick={handleStartGame} disabled={players.length === 0} className="px-8 py-4 bg-white text-kahoot-purple font-black text-xl rounded-lg shadow-[0_6px_0_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-[6px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">Start Game</button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                    <div className="flex items-center gap-4 mb-8"><Users size={32} className="text-white" /><span className="text-2xl font-bold text-white">{players.length} Players Waiting</span></div>
                    <div className="flex flex-wrap gap-4 justify-center max-w-4xl">{players.map(p => (<div key={p.id} className="animate-pop px-6 py-3 bg-white rounded-lg font-bold text-xl shadow-lg transform transition-all hover:scale-105">{p.name}</div>))}</div>
                </div>
            </div>
        );
    }

    if (status === 'question') {
        return (
            <div className="flex flex-col min-h-screen bg-slate-100">
                <div className="p-4 bg-white shadow-sm flex justify-between items-center">
                    <div className="font-bold text-gray-500">Host View</div>
                    <div className="text-3xl font-black text-kahoot-purple">{timeLeft}</div>
                    <button onClick={handleShowResults} className="px-4 py-2 bg-gray-200 rounded font-bold">Skip</button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                    {currentQuestion.imageUrl && <img src={currentQuestion.imageUrl} alt="Question" className="h-64 object-contain rounded-lg shadow-lg mb-8 bg-white p-2" />}
                    <h2 className="text-4xl font-black text-center mb-12 max-w-4xl">{currentQuestion.question}</h2>
                    <div className="flex gap-12 items-center">
                        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg"><span className="text-6xl font-black text-kahoot-blue">{answerCount}</span><span className="text-gray-500 font-bold">Answers</span></div>
                        <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg"><span className="text-6xl font-black text-kahoot-green">{players.length}</span><span className="text-gray-500 font-bold">Players</span></div>
                    </div>
                </div>
                <div className="h-2 bg-gray-200 w-full"><div className="h-full bg-kahoot-purple transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / currentQuestion.time) * 100}%` }} /></div>
            </div>
        );
    }

    if (status === 'results' || status === 'game_over') {
        return (
            <div className="flex flex-col min-h-screen bg-nst-dark">
                <div className="p-8 text-center text-white"><h1 className="text-4xl font-black mb-2">{status === 'game_over' ? 'FINAL SCORES' : 'SCOREBOARD'}</h1></div>
                <div className="flex-1 flex flex-col items-center p-8 gap-4">
                    {leaderboard.slice(0, 5).map((player, index) => (
                        <div key={player.id} className="w-full max-w-2xl bg-white p-4 rounded-lg shadow-lg flex items-center justify-between animate-pop" style={{ animationDelay: `${index * 0.1}s` }}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-white text-xl ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-indigo-500'}`}>{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}</div>
                                <span className="text-xl font-bold">{player.name}</span>
                            </div>
                            <span className="text-xl font-black text-gray-800">{player.score}</span>
                        </div>
                    ))}
                </div>
                <div className="p-8 flex justify-end">
                    {status !== 'game_over' && (
                        <button onClick={handleNextQuestion} className="px-8 py-4 bg-white text-kahoot-purple font-black text-xl rounded-lg shadow-[0_6px_0_rgba(255,255,255,0.5)] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-2">Next <ChevronRight /></button>
                    )}
                </div>
            </div>
        );
    }
    return <div>Loading...</div>;
}

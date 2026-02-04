import { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X, Ban, Smile } from 'lucide-react';

const SHAPES = [
    { color: 'bg-kahoot-red', shape: 'Triangle' },
    { color: 'bg-kahoot-blue', shape: 'Diamond' },
    { color: 'bg-kahoot-yellow', shape: 'Circle' },
    { color: 'bg-kahoot-green', shape: 'Square' },
];

const REACTIONS = ['😂', '❤️', '🔥', '👍'];

export default function Player() {
    const socket = useSocket();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [pin, setPin] = useState(searchParams.get('pin') || '');
    const [name, setName] = useState('');
    const [status, setStatus] = useState('join');
    const [score, setScore] = useState(0);
    const [questionData, setQuestionData] = useState(null);
    const [myAnswer, setMyAnswer] = useState(null);
    const [lastResult, setLastResult] = useState(null);
    const [localReactions, setLocalReactions] = useState([]);
    const [finalLeaderboard, setFinalLeaderboard] = useState([]); // Array of {id, name, score}

    useEffect(() => {
        if (!socket) return;
        socket.on('joined_success', ({ pin }) => setStatus('lobby'));
        socket.on('error', (msg) => alert(msg));
        socket.on('game_started', () => setStatus('playing'));
        socket.on('new_question', (q) => { setStatus('playing'); setQuestionData(q); setMyAnswer(null); setLastResult(null); });
        socket.on('round_results', ({ correctAnswer, leaderboard }) => {
            setStatus('result');
            const amICorrect = myAnswer === correctAnswer;
            const myScoreEntry = leaderboard.find(p => p.id === socket.id);
            const currentScore = myScoreEntry ? myScoreEntry.score : 0;
            setLastResult({ correct: amICorrect, currentScore });
            setScore(currentScore);
        });
        socket.on('game_over', (leaderboard) => {
            setStatus('game_over');
            setFinalLeaderboard(leaderboard);
            const myScoreEntry = leaderboard.find(p => p.id === socket.id);
            const currentScore = myScoreEntry ? myScoreEntry.score : 0;
            setScore(currentScore);
        });

        return () => {
            socket.off('joined_success'); socket.off('error'); socket.off('game_started');
            socket.off('new_question'); socket.off('round_results'); socket.off('game_over');
        };
    }, [socket, myAnswer]);

    const handleJoin = (e) => { e.preventDefault(); if (pin && name) socket.emit('join_game', { pin, name }); };
    const submitAnswer = (idx) => { if (status === 'playing') { setMyAnswer(idx); socket.emit('submit_answer', { pin, answerIdx: idx }); setStatus('answered'); } };
    const sendReaction = (emoji) => {
        socket.emit('send_reaction', { pin, emoji });
        const id = Date.now() + Math.random();
        setLocalReactions(prev => [...prev, { id, emoji, left: 50 + (Math.random() * 40 - 20) }]);
        setTimeout(() => setLocalReactions(prev => prev.filter(r => r.id !== id)), 2000);
    };

    const renderLocalReactions = () => (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
            {localReactions.map(r => (
                <div key={r.id} className="absolute bottom-20 text-6xl animate-floatUp" style={{ left: `${r.left}%` }}>{r.emoji}</div>
            ))}
        </div>
    );

    if (status === 'join') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
                    <h1 className="text-4xl font-black mb-8 text-gray-800">NST QUIZ</h1>
                    <input type="text" placeholder="Game PIN" value={pin} onChange={e => setPin(e.target.value)} className="w-full mb-4 p-4 text-center font-bold text-xl border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
                    <input type="text" placeholder="Nickname" value={name} onChange={e => setName(e.target.value)} className="w-full mb-6 p-4 text-center font-bold text-xl border-2 border-gray-200 rounded-lg focus:outline-none focus:border-gray-400" />
                    <button onClick={handleJoin} className="w-full py-4 bg-gray-800 text-white font-bold text-xl rounded-lg shadow-[0_6px_0_rgb(30,30,30)] active:shadow-none active:translate-y-[6px] transition-all">Enter</button>
                </div>
            </div>
        );
    }

    if (status === 'lobby') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-kahoot-green relative overflow-hidden">
                {renderLocalReactions()}
                <div className="text-white text-center mb-12"><h2 className="text-3xl font-bold mb-4">You're in!</h2><div className="text-xl font-medium opacity-80">See your nickname on screen?</div><div className="mt-8 text-6xl font-black">{name}</div></div>
                <div className="fixed bottom-0 left-0 w-full bg-black/20 backdrop-blur-md p-4 flex justify-center gap-4 safe-p-b z-50">
                    {REACTIONS.map(emoji => (<button key={emoji} onClick={() => sendReaction(emoji)} className="text-4xl hover:scale-125 transition-transform active:scale-90">{emoji}</button>))}
                </div>
            </div>
        );
    }

    if (status === 'playing') {
        return (
            <div className="min-h-screen flex flex-col relative overflow-hidden">
                {renderLocalReactions()}
                <div className="p-4 bg-white shadow-sm flex justify-between items-center font-bold text-gray-600"><div>PIN: {pin}</div><div>{name}</div><div className="bg-gray-100 px-3 py-1 rounded">{score}</div></div>
                {questionData?.imageUrl && <div className="h-40 bg-gray-50 flex items-center justify-center p-2"><img src={questionData.imageUrl} alt="Q" className="h-full object-contain" /></div>}
                <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4">
                    {SHAPES.map((s, idx) => (
                        <button key={idx} onClick={() => submitAnswer(idx)} className={`${s.color} rounded-xl shadow-[0_6px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[6px] transition-all flex items-center justify-center`}><span className="text-white font-black text-xl p-2 text-center break-words w-full">{questionData?.options?.[idx] || s.shape}</span></button>
                    ))}
                </div>
            </div>
        );
    }

    if (status === 'answered') {
        return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100"><div className="text-4xl font-black text-gray-800 mb-4">Answer Sent!</div><div className="text-xl text-gray-500 animate-pulse">Waiting for others...</div></div>;
    }

    if (status === 'result') {
        const isCorrect = lastResult?.correct;
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen ${isCorrect ? 'bg-kahoot-green' : 'bg-kahoot-red'} text-white`}>
                <div className="mb-6 bg-white/20 p-8 rounded-full mb-8">{isCorrect ? <Check size={64} /> : <X size={64} />}</div>
                <h2 className="text-5xl font-black mb-4">{isCorrect ? 'Correct!' : 'Incorrect'}</h2>
                <div className="text-2xl font-bold opacity-90">+ {isCorrect ? '1000' : '0'} points</div>
                <div className="mt-12 p-4 bg-black/20 rounded-xl"><div className="text-sm font-bold opacity-70 mb-1">Total Score</div><div className="text-3xl font-black">{lastResult?.currentScore}</div></div>
            </div>
        );
    }

    if (status === 'game_over') {
        return (
            <div className="flex flex-col min-h-screen bg-purple-900 text-white overflow-y-auto">
                <div className="text-center p-8">
                    <h1 className="text-4xl font-black mb-2">Game Over</h1>
                    <div className="text-2xl opacity-80">Your Score: {score}</div>
                </div>

                <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full flex flex-col gap-3">
                    {finalLeaderboard.slice(0, 10).map((player, index) => (
                        <div key={player.id} className={`flex items-center justify-between p-4 rounded-lg shadow-md ${player.id === socket.id ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-900 ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-400' : 'bg-white'}`}>
                                    {index + 1}
                                </div>
                                <span className={player.id === socket.id ? 'text-gray-900 font-bold' : 'text-white font-medium'}>{player.name} {player.id === socket.id && '(You)'}</span>
                            </div>
                            <span className={player.id === socket.id ? 'text-gray-900 font-bold' : 'text-white'}>{player.score}</span>
                        </div>
                    ))}
                </div>

                <div className="p-4 flex justify-center sticky bottom-0 bg-purple-900/90 backdrop-blur">
                    <button onClick={() => { setStatus('join'); setScore(0); }} className="bg-white text-purple-900 px-8 py-3 rounded-lg font-bold shadow-lg">Play Again</button>
                </div>
            </div>
        );
    }

    return <div>Loading...</div>;
}

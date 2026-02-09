import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Trash2, Eye, Plus } from 'lucide-react';

export default function QuizLibrary() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [previewQuiz, setPreviewQuiz] = useState(null);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const isProduction = import.meta.env.PROD;
            const url = isProduction ? '/quizzes' : `http://${window.location.hostname}:3000/quizzes`;
            const res = await fetch(url);
            const data = await res.json();
            if (Array.isArray(data)) setQuizzes(data);
        } catch (e) {
            console.error("Failed to fetch quizzes", e);
        }
    };

    const deleteQuiz = async (id) => {
        if (!confirm("Are you sure you want to delete this quiz?")) return;
        try {
            const isProduction = import.meta.env.PROD;
            const url = isProduction ? `/quizzes/${id}` : `http://${window.location.hostname}:3000/quizzes/${id}`;
            await fetch(url, { method: 'DELETE' });
            setQuizzes(quizzes.filter(q => q.id !== id));
        } catch (e) {
            alert("Failed to delete quiz");
        }
    };

    const startQuiz = (quiz) => {
        // Navigate to Host with quiz data state
        navigate('/host', { state: { loadQuiz: quiz } });
    };

    return (
        <div className="min-h-screen bg-slate-100 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 bg-white rounded-full shadow hover:bg-gray-50 transition-colors">
                            <ArrowLeft size={24} className="text-gray-600" />
                        </Link>
                        <h1 className="text-4xl font-black text-nst-primary">My Quiz Library</h1>
                    </div>
                    <Link to="/host" className="flex items-center gap-2 px-6 py-3 bg-kahoot-purple text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-all">
                        <Plus size={20} /> Create New
                    </Link>
                </div>

                {quizzes.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                        <div className="text-6xl mb-4">📚</div>
                        <h2 className="text-2xl font-bold text-gray-400 mb-2">No Saved Quizzes</h2>
                        <p className="text-gray-500 mb-8">Create a quiz and save it to see it here.</p>
                        <Link to="/host" className="text-kahoot-blue font-bold hover:underline">Go to Creator</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {quizzes.map(quiz => (
                            <div key={quiz.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-xl transition-shadow">
                                <div className="h-32 bg-gradient-to-r from-kahoot-purple to-kahoot-blue p-6 flex flex-col justify-end">
                                    <h3 className="text-white font-bold text-xl line-clamp-2">{quiz.title || "Untitled Quiz"}</h3>
                                    <div className="text-white/80 text-sm font-medium">{quiz.questions.length} Questions</div>
                                </div>
                                <div className="p-4 flex-1">
                                    <div className="text-gray-500 text-sm mb-4">Created: {new Date(quiz.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
                                    <button onClick={() => deleteQuiz(quiz.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Delete">
                                        <Trash2 size={20} />
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPreviewQuiz(quiz)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2">
                                            <Eye size={18} /> Preview
                                        </button>
                                        <button onClick={() => startQuiz(quiz)} className="px-4 py-2 bg-kahoot-green text-white font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-[0_4px_0_rgb(21,118,5)] active:shadow-none active:translate-y-[4px]">
                                            <Play size={18} /> Host
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Preview Modal */}
            {previewQuiz && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl animate-pop">
                        <div className="p-6 border-b flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black text-gray-800">{previewQuiz.title}</h2>
                                <p className="text-gray-500 font-medium">{previewQuiz.questions.length} Questions</p>
                            </div>
                            <button onClick={() => setPreviewQuiz(null)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {previewQuiz.questions.map((q, i) => (
                                <div key={i} className="bg-gray-50 p-4 rounded-xl border">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-600">Q{i + 1}</span>
                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded font-mono">{q.time}s</span>
                                    </div>
                                    <p className="font-bold text-lg mb-4">{q.text}</p>
                                    {q.imageUrl && <img src={q.imageUrl} alt="Q" className="h-32 object-contain rounded mb-4 border" />}
                                    <div className="grid grid-cols-2 gap-2">
                                        {q.options.map((opt, oi) => (
                                            <div key={oi} className={`p-2 rounded border text-sm flex items-center gap-2 ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-800 font-bold' : 'bg-white text-gray-600'}`}>
                                                {opt.isCorrect && <span className="text-green-600">✓</span>}
                                                {opt.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button onClick={() => setPreviewQuiz(null)} className="px-6 py-3 font-bold text-gray-600 hover:bg-gray-200 rounded-lg">Close</button>
                            <button onClick={() => { startQuiz(previewQuiz); setPreviewQuiz(null); }} className="px-6 py-3 bg-kahoot-purple text-white font-bold rounded-lg shadow-lg hover:bg-purple-700">Host This Quiz</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

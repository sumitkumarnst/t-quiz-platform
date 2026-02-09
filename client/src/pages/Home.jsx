import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad2, GraduationCap, Lock, X } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [password, setPassword] = useState("");
    const [targetPath, setTargetPath] = useState(null); // '/host' or '/library'
    const [error, setError] = useState(false);

    const handleTeacherClick = (path) => {
        setTargetPath(path);
        setShowPasswordModal(true);
        setPassword("");
        setError(false);
    };

    const verifyPassword = (e) => {
        e.preventDefault();
        if (password === 'admin') { // Simple client-side check
            setShowPasswordModal(false);
            navigate(targetPath);
        } else {
            setError(true);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat blur-lg scale-110"
                style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg')" }}
            >
                <div className="absolute inset-0 bg-blue-950/80 mix-blend-multiply"></div> {/* Darker blue overlay */}
            </div>

            {/* Glowing Bulbs */}
            {/* Bulb 1: Top Right */}
            <div className="absolute top-20 right-24 flex items-center justify-center animate-pulse-slow">
                <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_40px_20px_rgba(250,204,21,0.6)] z-10"></div>
                <div className="absolute w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl"></div>
            </div>

            {/* Bulb 2: Top Left */}
            <div className="absolute top-32 left-32 flex items-center justify-center animate-pulse-slow" style={{ animationDelay: '1.5s' }}>
                <div className="w-3 h-3 bg-white rounded-full shadow-[0_0_30px_15px_rgba(250,204,21,0.5)] z-10"></div>
                <div className="absolute w-24 h-24 bg-yellow-500/20 rounded-full blur-xl"></div>
            </div>

            {/* Bulb 3: Bottom Right (Floating) */}
            <div className="absolute bottom-40 right-1/4 flex items-center justify-center animate-pulse-slow" style={{ animationDelay: '3s' }}>
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_10px_rgba(250,204,21,0.4)] z-10"></div>
                <div className="absolute w-16 h-16 bg-yellow-500/10 rounded-full blur-lg"></div>
            </div>

            <div className="z-10 text-center space-y-8 flex flex-col items-center">
                <img
                    src="/nst-logo.png"
                    alt="Newton School of Technology"
                    className="h-20 mb-4 drop-shadow-md rounded-xl"
                />
                <h1 className="text-6xl font-black text-white drop-shadow-lg tracking-tight mb-2">
                    NST QUIZ
                </h1>
                <p className="text-white/80 text-xl font-medium max-w-md mx-auto">
                    The ultimate competitive learning platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-6 mt-12">
                    <Link
                        to="/play"
                        className="group relative bg-white border-b-8 border-gray-300 hover:border-gray-400 active:border-b-0 active:translate-y-2 rounded-xl p-8 w-64 transition-all duration-100"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-kahoot-blue/10 rounded-full group-hover:scale-110 transition-transform">
                                <Gamepad2 size={48} className="text-kahoot-blue" />
                            </div>
                            <span className="text-2xl font-bold text-gray-800">I'm a Student</span>
                            <span className="text-sm text-gray-500 font-medium">Join a game</span>
                        </div>
                    </Link>

                    {/* Teacher Card - Password Protected */}
                    <div className="group relative bg-white border-b-8 border-gray-300 hover:border-gray-400 rounded-xl p-8 w-64 transition-all duration-100 cursor-default">
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-kahoot-purple/10 rounded-full group-hover:scale-110 transition-transform">
                                <GraduationCap size={48} className="text-kahoot-purple" />
                            </div>
                            <span className="text-2xl font-bold text-gray-800">I'm a Teacher</span>
                            <span className="text-sm text-gray-500 font-medium mb-2">Host a quiz</span>
                            <div className="flex gap-2 w-full">
                                <button onClick={() => handleTeacherClick('/host')} className="flex-1 bg-kahoot-purple text-white py-2 rounded-lg font-bold text-sm hover:bg-opacity-90 active:translate-y-1 transition-all">Create</button>
                                <button onClick={() => handleTeacherClick('/library')} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-300 active:translate-y-1 transition-all">Library</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute bottom-4 text-white/40 text-sm">
                Powered by Newton School of Technology
            </div>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-pop">
                        <div className="bg-kahoot-purple p-6 flex justify-between items-center text-white">
                            <h3 className="text-xl font-black flex items-center gap-2"><Lock size={20} /> Teacher Access</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={24} /></button>
                        </div>
                        <form onSubmit={verifyPassword} className="p-8">
                            <p className="text-gray-600 mb-6 font-medium">Please enter the teacher password to continue.</p>
                            <input
                                type="password"
                                autoFocus
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full text-lg p-4 border-2 rounded-xl outline-none transition-colors mb-4 font-bold ${error ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-kahoot-purple'}`}
                            />
                            {error && <p className="text-red-500 font-bold mb-4 animate-shake">Incorrect password!</p>}

                            <button type="submit" className="w-full py-4 bg-kahoot-purple text-white font-black text-xl rounded-xl shadow-[0_4px_0_rgb(50,20,100)] active:shadow-none active:translate-y-[4px] transition-all">
                                Unlock
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

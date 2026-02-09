import { Link } from 'react-router-dom';
import { Gamepad2, GraduationCap } from 'lucide-react';

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-kahoot-purple to-nst-dark p-4 relative overflow-hidden">
            {/* Background shapes */}
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-48 h-48 bg-kahoot-yellow/20 rounded-full blur-xl animate-pulse delay-75"></div>

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

                    <Link
                        to="/host"
                        className="group relative bg-white border-b-8 border-gray-300 hover:border-gray-400 active:border-b-0 active:translate-y-2 rounded-xl p-8 w-64 transition-all duration-100"
                    >
                        <div className="flex flex-col items-center gap-4">
                            <div className="p-4 bg-kahoot-purple/10 rounded-full group-hover:scale-110 transition-transform">
                                <GraduationCap size={48} className="text-kahoot-purple" />
                            </div>
                            <span className="text-2xl font-bold text-gray-800">I'm a Teacher</span>
                            <span className="text-sm text-gray-500 font-medium">Host a quiz</span>
                        </div>
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-4 text-white/40 text-sm">
                Powered by Newton School of Technology
            </div>
        </div>
    );
}

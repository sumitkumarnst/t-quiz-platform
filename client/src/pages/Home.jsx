import { Link } from 'react-router-dom';
import { Gamepad2, GraduationCap } from 'lucide-react';

export default function Home() {
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

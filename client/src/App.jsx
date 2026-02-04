import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Home from './pages/Home';
import Host from './pages/Host';
import Player from './pages/Player';

function App() {
  return (
    <SocketProvider>
      <Router>
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/host" element={<Host />} />
            <Route path="/play" element={<Player />} />
          </Routes>
        </div>
      </Router>
    </SocketProvider>
  );
}

export default App;

import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // 1. In Production (Render): Socket.io is on the same URL as the website (undefined).
        // 2. In Development (Vite): Socket.io is on port 3000, but we want to support LAN IP too.
        const isProduction = import.meta.env.PROD;

        const socketUrl = isProduction
            ? undefined
            : `http://${window.location.hostname}:3000`;

        const newSocket = io(socketUrl);
        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

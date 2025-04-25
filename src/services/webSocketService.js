import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const webSocketService = {
    client: null,
    connect: (onMessageReceived) => {
        // Initialize the WebSocket client
        const socket = new SockJS('http://localhost:8080/ws');
        webSocketService.client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000, // Reconnect after 5 seconds if disconnected
            heartbeatIncoming: 4000, // Heartbeat every 4 seconds
            heartbeatOutgoing: 4000,
        });

        // On connect, subscribe to the orders topic
        webSocketService.client.onConnect = () => {
            console.log('Connected to WebSocket');
            webSocketService.client.subscribe('/topic/orders', (message) => {
                if (message.body) {
                    const newOrder = JSON.parse(message.body);
                    onMessageReceived(newOrder);
                }
            });
        };

        // Log errors
        webSocketService.client.onStompError = (frame) => {
            console.error('WebSocket error:', frame);
        };

        // Activate the client
        webSocketService.client.activate();
    },

    disconnect: () => {
        if (webSocketService.client) {
            webSocketService.client.deactivate();
            console.log('Disconnected from WebSocket');
        }
    },
};

export default webSocketService;
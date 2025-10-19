// This file contains a custom hook for managing messages in the application.

import { useEffect, useState } from 'react';
import { fetchMessages } from '../services/api';
import { Message } from '../types';

const useMessages = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadMessages = async () => {
            try {
                const fetchedMessages = await fetchMessages();
                setMessages(fetchedMessages);
            } catch (err) {
                setError('Failed to load messages');
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, []);

    return { messages, loading, error };
};

export default useMessages;
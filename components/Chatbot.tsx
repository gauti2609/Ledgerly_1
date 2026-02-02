import React, { useState, useRef, useEffect } from 'react';
import { ChatBubbleOvalLeftEllipsisIcon, CloseIcon, PaperAirplaneIcon } from './icons.tsx';
import * as geminiService from '../services/geminiService.ts';

interface ChatbotProps {
    token: string;
}

type Message = {
    role: 'user' | 'model';
    parts: { text: string }[];
};

export const Chatbot: React.FC<ChatbotProps> = ({ token }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', parts: [{ text: "Hello! I'm your AI accounting assistant. How can I help you with Indian Accounting Standards or Schedule III?" }] }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const history = [...messages, userMessage];
            const modelResponseText = await geminiService.getChatResponse(token, history);
            const modelMessage: Message = { role: 'model', parts: [{ text: modelResponseText }] };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            console.error("Chatbot error:", error);
            const errorMessage: Message = { role: 'model', parts: [{ text: "Sorry, I couldn't get a response. Please try again." }] };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110"
                aria-label="Open chatbot"
            >
                <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-full max-w-sm h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold">AI Assistant</h3>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-gray-700">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </header>
            <main className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-brand-blue text-white' : 'bg-gray-700'}`}>
                            {msg.parts[0].text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-[80%] p-3 rounded-lg bg-gray-700">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t border-gray-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask a question..."
                        className="flex-1 bg-gray-700 border border-gray-600 rounded-full py-2 px-4 focus:ring-brand-blue focus:border-brand-blue"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 bg-brand-blue rounded-full text-white disabled:bg-gray-600">
                        <PaperAirplaneIcon className="w-5 h-5"/>
                    </button>
                </div>
            </footer>
        </div>
    );
};

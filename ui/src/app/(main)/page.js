"use client";

import React, { useState, useEffect, useRef } from 'react';
import styles from './page.module.css';
import ChatBubble from '../../components/ChatBubble';
import LogoutButton from '@/auth/LogoutButton';

const API_BASE = 'http://localhost:8000/api/v1/genie';

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [spaceId, setSpaceId] = useState('00000000-0000-0000-0000-000000000000');
  const [conversationId, setConversationId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  const pollStatus = async (msgId, currentConvId, space) => {
    let waitTime = 1000;
    const maxWait = 5000;
    const startTime = Date.now();
    const timeout = 10 * 60 * 1000; 

    while (Date.now() - startTime < timeout) {
      try {
        const res = await fetch(`${API_BASE}/status/${msgId}?space_id=${space}&conversation_id=${currentConvId}`);
        const data = await res.json();

        setMessages(prev => prev.map(m => 
          m.message_id === msgId ? { ...m, ...data } : m
        ));

        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
          setIsProcessing(false);
          return; 
        }
      } catch (err) {
        console.error("Polling error:", err);
      }

      await new Promise(resolve => setTimeout(resolve, waitTime));
      waitTime = Math.min(waitTime * 2, maxWait);
    }
    
    setMessages(prev => prev.map(m => 
      m.message_id === msgId ? { ...m, status: 'FAILED', status_message: 'Timed out' } : m
    ));
    setIsProcessing(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !spaceId || isProcessing) return;

    const content = inputValue;
    setInputValue('');
    setIsProcessing(true);

    const tempUserMsgId = Date.now().toString();
    setMessages(prev => [...prev, { role: 'user', content, id: tempUserMsgId }]);

    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          content: content,
          conversation_id: conversationId 
        })
      });

      if (!res.ok) {
        let errorData = res.statusText;
        try {
          const jsonError = await res.json();
          errorData = jsonError.detail || jsonError.message || errorData;
        } catch (_) {}
        
        setMessages(prev => [...prev, {
          role: 'genie',
          status: 'FAILED',
          status_message: errorData
        }]);
        setIsProcessing(false);
        return;
      }
      
      const sessionData = await res.json();
      const newMsgId = sessionData.message_id;
      const newConvId = sessionData.conversation_id;
      
      if (!conversationId) setConversationId(newConvId);

      setMessages(prev => [...prev, {
        role: 'genie',
        message_id: newMsgId,
        status: 'STARTING',
        status_message: 'Message Sent'
      }]);

      pollStatus(newMsgId, newConvId, spaceId);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'genie',
        status: 'FAILED',
        status_message: err.message || 'Failed to connect to backend'
      }]);
      setIsProcessing(false);
    }
  };

  const handleFeedback = async (msgId, rating) => {
    try {
      await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          space_id: spaceId,
          conversation_id: conversationId,
          message_id: msgId,
          rating: rating
        })
      });
    } catch (err) {
      console.error("Failed to submit feedback:", err);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topNav}>
        <div className={styles.modelSelector}>
          <span className={styles.modelLabel}>Genie Space</span>
          <span className={styles.modelChevron}>▼</span>
          <input 
            type="text" 
            value={spaceId} 
            onChange={(e) => setSpaceId(e.target.value)}
            placeholder="workspace-id"
            className={styles.spaceIdInput}
            title="Genie Space ID"
          />
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <LogoutButton className="rounded-lg hover:bg-white/5" />
      </div>

      <div className={styles.chatWindow} ref={chatWindowRef}>
        <div className={styles.chatWindowInner}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: '10vh' }}>
              <h2 style={{ fontWeight: '500', fontSize: '1.5rem', marginBottom: '1rem' }}>Hey! What are we tackling today?</h2>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <ChatBubble 
              key={msg.message_id || msg.id || idx} 
              message={msg} 
              onFeedback={handleFeedback}
            />
          ))}
        </div>
      </div>

      <div className={styles.inputWrapper}>
        <form className={styles.inputArea} onSubmit={handleSend}>
          <button type="button" className={styles.iconButton} aria-label="Add Attachment">
            +
          </button>
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything"
            className={styles.inputField}
            disabled={isProcessing}
          />
          <button 
            type="submit" 
            className={styles.sendButton}
            disabled={!inputValue.trim() || isProcessing || !spaceId}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L12 20M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </form>
        <div className={styles.footerText}>
          Databricks Genie can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const FloatingChat = () => {
  const { lang } = useLanguage();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isAdmin = user && ['admin', 'helpdesk'].includes(user.role);

  const getPillStyle = () => ({
    backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '0.35rem 0.7rem',
    fontSize: '0.75rem',
    color: isDark ? '#cbd5e1' : '#475569',
    cursor: 'pointer',
    fontWeight: 600,
    transition: 'all 0.15s ease',
    outline: 'none',
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [waitingSessions, setWaitingSessions] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageAreaRef = useRef(null);
  const pollingRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const justOpenedRef = useRef(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Localization strings
  const text = {
    id: {
      tooltip: 'Tanya AI Assistant',
      title: 'Virtual Assistant',
      subtitle: 'Wisma 46 Space AI · Online',
      waitingAdmin: 'Menghubungkan ke Customer Service...',
      humanMode: 'Terhubung dengan Customer Service Wisma 46',
      inputPlaceholder: 'Ketik pesan Anda...',
      send: 'Kirim',
      chatAdminBtn: '🙋 Hubungi Customer Service',
      waFallback: 'Atau Hubungi WhatsApp ↗',
      welcome: 'Selamat datang! Ada yang bisa saya bantu seputar Wisma 46 Space?',
      emptyPrompt1: '🏢 Info Ruangan',
      emptyPrompt2: '💰 Harga & Promo',
      emptyPrompt3: '📋 Cara Booking',
    },
    en: {
      tooltip: 'Ask AI Assistant',
      title: 'Virtual Assistant',
      subtitle: 'Wisma 46 Space AI · Online',
      waitingAdmin: 'Connecting to Customer Service...',
      humanMode: 'Connected with Wisma 46 Customer Service',
      inputPlaceholder: 'Type your message...',
      send: 'Send',
      chatAdminBtn: '🙋 Contact Customer Service',
      waFallback: 'Or Contact via WhatsApp ↗',
      welcome: 'Welcome! How can I help you regarding Wisma 46 Space?',
      emptyPrompt1: '🏢 Room Info',
      emptyPrompt2: '💰 Prices & Promos',
      emptyPrompt3: '📋 How to Book',
    }
  };

  const t = text[lang] || text.id;

  // Scroll to bottom helper
  const scrollToBottom = () => {
    const scroll = () => {
      if (messageAreaRef.current) {
        messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
      }
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    scroll();
    setTimeout(scroll, 50);
    setTimeout(scroll, 150);
    setTimeout(scroll, 300);
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const isListItem = /^\d+\.\s/.test(line) || /^-\s/.test(line);
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const formattedLine = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div 
          key={idx} 
          style={{ 
            minHeight: line.trim() === '' ? '0.5rem' : 'auto', 
            marginBottom: '0.45rem', 
            lineHeight: '1.65',
            paddingLeft: isListItem ? '1.2rem' : '0',
            textIndent: isListItem ? '-1.2rem' : '0'
          }}
        >
          {formattedLine}
        </div>
      );
    });
  };

  useEffect(() => {
    if (!isOpen) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    // Scroll to bottom always on first load/open
    if (justOpenedRef.current && messages.length > 0) {
      scrollToBottom();
      justOpenedRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    if (isNewMessage) {
      const lastMessage = messages[messages.length - 1];
      const isUserMsg = lastMessage?.sender_type === 'user';
      
      // Check if user was near bottom before the update
      const container = messageAreaRef.current;
      let nearBottom = true;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        nearBottom = scrollHeight - scrollTop - clientHeight < 160;
      }

      if (isUserMsg || nearBottom) {
        scrollToBottom();
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && isTyping) {
      const container = messageAreaRef.current;
      let nearBottom = true;
      if (container) {
        const { scrollTop, scrollHeight, clientHeight } = container;
        nearBottom = scrollHeight - scrollTop - clientHeight < 160;
      }
      if (nearBottom) {
        scrollToBottom();
      }
    }
  }, [isTyping, isOpen]);

  useEffect(() => {
    if (isOpen && !isTyping) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, isTyping]);

  // Check login token (nested inside the user object as JSON)
  const getToken = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const userObj = JSON.parse(userStr);
      return userObj?.token || null;
    } catch {
      return null;
    }
  };

  // Poll waiting sessions if admin
  useEffect(() => {
    if (!isOpen || !isAdmin) return;

    const loadWaitingSessions = async () => {
      const token = getToken();
      if (!token) return;
      try {
        const res = await fetch('/api/admin/chat/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (res.ok) {
          const data = await res.json();
          // filter sessions that are in waiting mode or have unread messages
          const waiting = data.filter(s => s.mode === 'waiting' || s.unread_count > 0);
          setWaitingSessions(waiting);
        }
      } catch (err) {
        console.error('Error loading waiting sessions:', err);
      }
    };

    loadWaitingSessions();
    const interval = setInterval(loadWaitingSessions, 5000);
    return () => clearInterval(interval);
  }, [isOpen, isAdmin]);

  // Open Custom Reset Modal
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  // Restart AI Chat Session after confirmation
  const confirmResetChatSession = async () => {
    setShowResetConfirm(false);
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/chat/reset', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        setMessages([]);
        setSession(null);
        // We call startSession to initialize a fresh one
        const freshRes = await fetch('/api/chat/session', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (freshRes.ok) {
          const freshData = await freshRes.json();
          setSession(freshData);
          // fetch messages for the fresh session
          const msgRes = await fetch('/api/chat/messages', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json'
            }
          });
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData);
          }
        }
      }
    } catch (err) {
      console.error('Error resetting session:', err);
    }
  };

  // Start chat session
  const startSession = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/chat/session', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data);
        fetchMessages();
      }
    } catch (err) {
      console.error('Error starting chat session:', err);
    }
  };

  // Fetch messages
  const fetchMessages = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch('/api/chat/messages', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Update session mode dynamically in case admin takes over
        const sessionRes = await fetch('/api/chat/session', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setSession(sessionData);
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  // Toggle chat window open/close
  const toggleChat = () => {
    if (!isOpen) {
      // Check login first
      const token = getToken();
      if (!token) {
        setShowAuthModal(true);
        return;
      }
      justOpenedRef.current = true;
      startSession();
      // Start short polling
      pollingRef.current = setInterval(fetchMessages, 3000);
    } else {
      // Clear polling when closed
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }
    setIsOpen(!isOpen);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Send message
  const handleSend = async (textToSend) => {
    if (isTyping) return;
    const content = textToSend || inputText;
    if (!content.trim()) return;

    const token = getToken();
    if (!token) return;

    setInputText('');
    setIsTyping(true);

    // Optimistically add user message
    const tempUserMsg = {
      id: Date.now(),
      sender_type: 'user',
      content: content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    // Focus input immediately so keyboard stays open on mobile & enter key doesn't defocus
    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    // Explicitly scroll down for user-sent messages
    setTimeout(scrollToBottom, 50);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setIsTyping(false);
      // Refocus input after sending is complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  // Request human admin
  const handleRequestHuman = async () => {
    const token = getToken();
    if (!token) return;

    setIsTyping(true);
    try {
      const res = await fetch('/api/chat/request-human', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.session);
        fetchMessages();
      }
    } catch (err) {
      console.error('Error requesting CS admin:', err);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle prompt pill click
  const handlePromptClick = (prompt) => {
    handleSend(prompt);
  };

  return (
    <>


      {/* Rendering different view if logged in as Admin */}
      {isAdmin ? (
        <div style={{ position: 'fixed', bottom: '110px', right: '36px', zIndex: 9999 }}>
          {/* Backdrop to close when click outside */}
          {isOpen && (
            <>
              <div
                onClick={() => setIsOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
              />
              <div 
                className="floating-chat-admin-window"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  border: isDark ? '1px solid #1e293b' : '1px solid rgba(0,0,0,0.08)'
                }}
              >
                {/* Header */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderBottom: '3px solid #eab308',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'white',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>🎧</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Wisma 46 CS Portal</h4>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#cbd5e1' }}>Live Chat {user?.role === 'helpdesk' ? 'Helpdesk' : 'Admin'} Console</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                {/* Body */}
                <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: isDark ? '#0f172a' : '#ffffff' }}>
                  <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📢</div>
                    <h5 style={{ margin: 0, fontSize: '1rem', color: isDark ? '#ffffff' : '#1e293b', fontWeight: 700 }}>
                      {waitingSessions.length > 0 
                        ? `Ada ${waitingSessions.length} Chat Menunggu!` 
                        : 'Semua Chat Terjawab'}
                    </h5>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: isDark ? '#cbd5e1' : '#64748b' }}>
                      {waitingSessions.length > 0 
                        ? `Silakan buka dashboard ${user?.role === 'helpdesk' ? 'helpdesk' : 'admin'} untuk mengambil alih chat.` 
                        : 'Belum ada pengguna baru yang membutuhkan eskalasi ke CS.'}
                    </p>
                  </div>

                  {waitingSessions.length > 0 && (
                    <div style={{ border: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      {waitingSessions.slice(0, 3).map((s, idx) => (
                        <div key={s.id} style={{
                          padding: '0.65rem 0.75rem',
                          backgroundColor: isDark ? (idx % 2 === 0 ? '#1e293b' : '#0f172a') : (idx % 2 === 0 ? '#f8fafc' : '#ffffff'),
                          borderBottom: idx === waitingSessions.slice(0, 3).length - 1 ? 'none' : (isDark ? '1px solid #1e293b' : '1px solid #f1f5f9'),
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.8rem'
                        }}>
                          <span style={{ fontWeight: 600, color: isDark ? '#cbd5e1' : '#334155', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {s.user?.name || `User #${s.user_id}`}
                          </span>
                          <span style={{
                            backgroundColor: s.mode === 'waiting' ? '#fee2e2' : (isDark ? '#334155' : '#f1f5f9'),
                            color: s.mode === 'waiting' ? '#ef4444' : (isDark ? '#cbd5e1' : '#475569'),
                            fontSize: '0.65rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 700
                          }}>
                            {s.mode === 'waiting' ? 'WAITING' : 'NEW MSG'}
                          </span>
                        </div>
                      ))}
                      {waitingSessions.length > 3 && (
                        <div style={{ padding: '4px', textAlign: 'center', fontSize: '0.7rem', color: isDark ? '#64748b' : '#94a3b8', backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
                          + {waitingSessions.length - 3} chat lainnya
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => window.location.href = '/admin/chat'}
                    style={{
                      marginTop: 'auto',
                      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                      border: '1.5px solid #eab308',
                      color: '#ffffff',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      boxShadow: '0 8px 20px rgba(15,23,42,0.2)',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      outline: 'none'
                    }}
                  >
                    Buka Dashboard Chat {user?.role === 'helpdesk' ? 'Helpdesk' : 'Admin'} ↗
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Trigger Button */}
          <div style={{ position: 'relative' }}>
            {!isOpen && waitingSessions.length > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                backgroundColor: '#ef4444', color: 'white',
                fontSize: '0.75rem', fontWeight: 700,
                width: '20px', height: '20px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}>
                {waitingSessions.length}
              </span>
            )}
            {!isOpen && (
              <span style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                backgroundColor: waitingSessions.length > 0 ? '#ef4444' : '#eab308',
                animation: 'waPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                opacity: 0.4,
              }} />
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              style={{
                position: 'relative',
                width: '56px', height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '2px solid #eab308', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(15, 23, 42, 0.45), 0 0 10px rgba(234, 179, 8, 0.25)',
                transform: isOpen ? 'rotate(90deg) scale(1.05)' : isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontSize: '1.6rem',
              }}
            >
              {isOpen ? '✕' : '🎧'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ position: 'fixed', bottom: '110px', right: '36px', zIndex: 9999 }}>
          {/* Backdrop to close when click outside */}
          {isOpen && (
            <>
              <div
                onClick={() => {
                  setIsOpen(false);
                  if (pollingRef.current) clearInterval(pollingRef.current);
                }}
                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
              />

              <div 
                className="floating-chat-window"
                style={{
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  border: isDark ? '1px solid #1e293b' : '1px solid rgba(0,0,0,0.08)'
                }}
              >
                {/* Header with Dark Navy & Gold Theme */}
                <div style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderBottom: '3px solid #eab308',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: 'white',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1.5px solid #eab308',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.2rem',
                    }}>
                      🤖
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>
                        {session?.mode === 'human' ? t.humanMode : t.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                        {session?.mode === 'waiting' ? t.waitingAdmin : t.subtitle}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {session && (
                      <button
                        onClick={handleResetClick}
                        title={lang === 'en' ? 'Restart AI Assistant' : 'Mulai Ulang Percakapan AI'}
                        style={{
                          background: 'none', border: 'none', color: '#eab308',
                          fontSize: '1rem', cursor: 'pointer', opacity: 0.9,
                          padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        🔄
                      </button>
                    )}
                    <button
                      onClick={toggleChat}
                      style={{
                        background: 'none', border: 'none', color: 'white',
                        fontSize: '1.2rem', cursor: 'pointer', opacity: 0.8,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Message Area */}
                <div 
                  ref={messageAreaRef}
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.25rem 1.25rem 2.5rem 1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.85rem',
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>
                      <p style={{ fontSize: '1.1rem', margin: '0 0 0.5rem 0' }}>🤖</p>
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>{t.welcome}</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isUser = msg.sender_type === 'user';
                      const isSystem = msg.sender_type === 'system';

                      if (isSystem) {
                        return (
                           <div key={msg.id} style={{
                            alignSelf: 'center',
                            backgroundColor: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '16px',
                            fontSize: '0.75rem',
                            textAlign: 'center',
                            maxWidth: '90%',
                            fontWeight: 600,
                          }}>
                            {msg.content}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          style={{
                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          <div style={{
                            backgroundColor: isUser ? (isDark ? '#334155' : '#0f172a') : msg.sender_type === 'admin' ? '#10b981' : (isDark ? '#1e293b' : '#ffffff'),
                            color: isUser ? '#ffffff' : (isDark ? '#cbd5e1' : '#1e293b'),
                            padding: '0.8rem 1rem',
                            borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                            fontSize: '0.88rem',
                            lineHeight: '1.5',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                            border: isUser ? 'none' : (isDark ? '1px solid #334155' : '1px solid #e2e8f0'),
                          }}>
                            {renderMessageContent(msg.content)}
                          </div>
                          <span style={{
                            fontSize: '0.65rem',
                            color: '#94a3b8',
                            marginTop: '3px',
                            alignSelf: isUser ? 'flex-end' : 'flex-start',
                          }}>
                            {msg.sender_type === 'bot' ? 'Wisma 46 Bot' : msg.sender_type === 'admin' ? 'Customer Service' : 'Anda'}
                          </span>
                        </div>
                      );
                    })
                  )}
                  {isTyping && (
                    <div style={{ 
                      alignSelf: 'flex-start', 
                      display: 'flex', 
                      gap: '4px', 
                      padding: '0.5rem 1rem', 
                      backgroundColor: isDark ? '#1e293b' : '#ffffff', 
                      borderRadius: '16px', 
                      border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' 
                    }}>
                      <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'typingDot 1.4s infinite' }} />
                      <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'typingDot 1.4s infinite', animationDelay: '0.2s' }} />
                      <span className="typing-dot" style={{ width: '6px', height: '6px', backgroundColor: '#94a3b8', borderRadius: '50%', animation: 'typingDot 1.4s infinite', animationDelay: '0.4s' }} />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Prompt Pills (Shortcut buttons) - always visible in bot mode */}
                {session?.mode === 'bot' && (
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderTop: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    flexShrink: 0,
                  }}>
                    <button onClick={() => handlePromptClick(t.emptyPrompt1.substring(2))} style={getPillStyle()}>
                      {t.emptyPrompt1}
                    </button>
                    <button onClick={() => handlePromptClick(t.emptyPrompt2.substring(2))} style={getPillStyle()}>
                      {t.emptyPrompt2}
                    </button>
                    <button onClick={() => handlePromptClick(t.emptyPrompt3.substring(2))} style={getPillStyle()}>
                      {t.emptyPrompt3}
                    </button>
                    <button onClick={handleRequestHuman} style={{ 
                      ...getPillStyle(), 
                      backgroundColor: isDark ? '#d97706' : '#fef3c7', 
                      color: isDark ? '#fef9c3' : '#d97706', 
                      border: isDark ? '1px solid #ca8a04' : '1px solid #fde68a' 
                    }}>
                      {t.chatAdminBtn}
                    </button>
                  </div>
                )}

                {/* Chat Input Footer */}
                <div style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: isDark ? '#1e293b' : '#ffffff',
                  borderTop: isDark ? '1px solid #334155' : '1px solid #f1f5f9',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                  flexShrink: 0,
                }}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={t.inputPlaceholder}
                    style={{
                      flex: 1,
                      padding: '0.65rem 0.9rem',
                      border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                      borderRadius: '24px',
                      fontSize: '0.85rem',
                      outline: 'none',
                      backgroundColor: isDark ? '#0f172a' : (isTyping ? '#f1f5f9' : '#ffffff'),
                      color: isDark ? '#ffffff' : '#000000'
                    }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputText.trim() || isTyping}
                    style={{
                      backgroundColor: isDark ? '#eab308' : '#0f172a',
                      color: isDark ? '#0f172a' : 'white',
                      border: isDark ? 'none' : '1px solid #eab308',
                      padding: '0.65rem 1.2rem',
                      borderRadius: '24px',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      opacity: (!inputText.trim() || isTyping) ? 0.5 : 1,
                      boxShadow: '0 2px 8px rgba(15,23,42,0.15)',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t.send}
                  </button>
                </div>

                {/* WhatsApp Direct Fallback Footer */}
                <div style={{
                  padding: '0.5rem 1rem',
                  paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom, 0px))',
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderTop: isDark ? '1px solid #1e293b' : '1px solid #f1f5f9',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  flexShrink: 0,
                }}>
                  <a
                    href="https://wa.me/6281234567890"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#16a34a',
                      textDecoration: 'none',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {t.waFallback}
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Trigger Button */}
          <div style={{ position: 'relative' }}>
            {/* Tooltip hint on hover */}
            {isHovered && !isOpen && (
              <div style={{
                position: 'absolute', right: '70px', top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#1a202c', color: 'white',
                padding: '0.5rem 0.75rem', borderRadius: '8px',
                fontSize: '0.75rem', whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 10000,
                pointerEvents: 'none',
                fontFamily: 'Inter, sans-serif'
              }}>
                {t.tooltip}
                <div style={{
                  position: 'absolute', right: '-5px', top: '50%',
                  transform: 'translateY(-50%)',
                  width: 0, height: 0,
                  borderTop: '5px solid transparent',
                  borderBottom: '5px solid transparent',
                  borderLeft: '5px solid #1a202c',
                }} />
              </div>
            )}

            {/* Ring Ping Animation (Amber Gold Glow) */}
            {!isOpen && (
              <span style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                backgroundColor: '#eab308',
                animation: 'waPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                opacity: 0.4,
              }} />
            )}

            <button
              onClick={toggleChat}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              aria-label="AI Chat"
              style={{
                position: 'relative',
                width: '56px', height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                border: '2px solid #eab308', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(15, 23, 42, 0.45), 0 0 10px rgba(234, 179, 8, 0.25)',
                transform: isOpen ? 'rotate(90deg) scale(1.05)' : isHovered ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                fontSize: '1.6rem',
              }}
            >
              {isOpen ? '✕' : '💬'}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .floating-chat-admin-window {
          position: absolute;
          bottom: 60px;
          right: 0;
          z-index: 9999;
          width: 380px;
          max-width: 90vw;
          height: 480px;
          max-height: calc(100vh - 200px);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15,23,42,0.35);
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          animation: waPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(0,0,0,0.08);
          font-family: Inter, sans-serif;
        }

        .floating-chat-window {
          position: absolute;
          bottom: 60px;
          right: 0;
          z-index: 9999;
          width: 395px;
          max-width: 90vw;
          height: 630px;
          max-height: calc(100vh - 200px);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15,23,42,0.3);
          display: flex;
          flex-direction: column;
          background-color: #ffffff;
          animation: waPopIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 1px solid rgba(0,0,0,0.08);
        }

        @keyframes typingDot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes waPing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.4); opacity: 0; }
        }
        @keyframes waPopIn {
          from { opacity: 0; transform: scale(0.8) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        @media (max-width: 640px) {
          .floating-chat-admin-window,
          .floating-chat-window {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            height: 100dvh !important;
            max-height: 100vh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            z-index: 999999 !important;
          }
        }
      `}</style>

      {/* Beautiful Authentication Modal */}
      {showAuthModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '1rem',
        }}>
          {/* Close Backdrop click */}
          <div onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', inset: 0 }} />

          {/* Modal Container */}
          <div style={{
            position: 'relative',
            background: isDark 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: isDark 
              ? '1.5px solid rgba(234, 179, 8, 0.3)' 
              : '1.5px solid rgba(234, 179, 8, 0.25)',
            boxShadow: isDark 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 40px rgba(234, 179, 8, 0.1)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 40px rgba(234, 179, 8, 0.05)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            animation: 'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {/* Elegant Icon Badge */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
              border: '1.5px solid #eab308',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 8px 20px rgba(234, 179, 8, 0.15)'
            }}>
              🔒
            </div>

            {/* Content */}
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isDark ? '#ffffff' : '#0f172a',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.025em'
            }}>
              {lang === 'en' ? 'Sign In Required' : 'Perlu Masuk Akun'}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: isDark ? '#cbd5e1' : '#475569',
              margin: '0 0 2rem 0'
            }}>
              {lang === 'en' 
                ? 'Please sign in first to chat with our virtual assistant and connect with our human support team.' 
                : 'Silakan masuk/login terlebih dahulu untuk memulai percakapan dengan asisten virtual dan tim dukungan kami.'
              }
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={() => window.location.href = '/login'}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  border: 'none',
                  color: '#0f172a',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(234, 179, 8, 0.25)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {lang === 'en' ? 'Sign In Now' : 'Masuk Sekarang'}
              </button>
              <button
                onClick={() => setShowAuthModal(false)}
                style={{
                  width: '100%',
                  backgroundColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#cbd5e1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#e2e8f0'}
              >
                {lang === 'en' ? 'Cancel' : 'Batal'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Premium Custom Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '1rem',
        }}>
          {/* Close Backdrop click */}
          <div onClick={() => setShowResetConfirm(false)} style={{ position: 'absolute', inset: 0 }} />

          {/* Modal Container */}
          <div style={{
            position: 'relative',
            background: isDark 
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: isDark 
              ? '1.5px solid rgba(234, 179, 8, 0.3)' 
              : '1.5px solid rgba(234, 179, 8, 0.25)',
            boxShadow: isDark 
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 40px rgba(234, 179, 8, 0.1)' 
              : '0 25px 50px -12px rgba(0, 0, 0, 0.1), 0 0 40px rgba(234, 179, 8, 0.05)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            animation: 'modalFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}>
            {/* Warning Icon Badge themed in Gold */}
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '24px',
              background: 'linear-gradient(135deg, #fef9c3 0%, #fef3c7 100%)',
              border: '1.5px solid #eab308',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 8px 20px rgba(234, 179, 8, 0.15)'
            }}>
              🔄
            </div>

            {/* Content */}
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: isDark ? '#ffffff' : '#0f172a',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.025em'
            }}>
              {lang === 'en' ? 'Restart Conversation' : 'Mulai Ulang Percakapan'}
            </h3>
            <p style={{
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: isDark ? '#cbd5e1' : '#475569',
              margin: '0 0 2rem 0'
            }}>
              {lang === 'en' 
                ? 'Are you sure you want to delete your current chat history and restart a fresh session with our AI assistant?' 
                : 'Apakah Anda yakin ingin menghapus seluruh riwayat percakapan Anda dan memulai obrolan baru dengan asisten AI?'
              }
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: isDark ? '#334155' : '#e2e8f0',
                  color: isDark ? '#ffffff' : '#475569',
                  border: 'none',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = isDark ? '#475569' : '#cbd5e1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = isDark ? '#334155' : '#e2e8f0'}
              >
                {lang === 'en' ? 'Cancel' : 'Batal'}
              </button>
              <button
                onClick={confirmResetChatSession}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  border: 'none',
                  color: '#0f172a',
                  padding: '0.85rem 1.5rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  boxShadow: '0 10px 25px rgba(234, 179, 8, 0.25)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {lang === 'en' ? 'Yes, Restart' : 'Ya, Restart'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;

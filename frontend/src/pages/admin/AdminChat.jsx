import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const AdminChat = () => {
  const { lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { user } = useAuth();
  const role = user?.role || 'admin';

  const getSenderLabel = (msg) => {
    const isBot = msg.sender_type === 'bot';
    const isAdminMsg = msg.sender_type === 'admin';
    
    if (isBot) return 'Wisma 46 Bot 🤖';
    if (isAdminMsg) {
      if (msg.sender) {
        const senderRole = msg.sender.role === 'helpdesk' ? 'Helpdesk' : 'Admin';
        if (user && msg.sender_id === user.id) {
          return lang === 'id' ? `Saya (${senderRole}) 🎧` : `Me (${senderRole}) 🎧`;
        }
        return `${msg.sender.name} (${senderRole}) 🎧`;
      }
      const defaultRole = role === 'helpdesk' ? 'Helpdesk' : 'Admin';
      return lang === 'id' ? `Saya (${defaultRole}) 🎧` : `Me (${defaultRole}) 🎧`;
    }
    return 'User 👤';
  };

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Custom modal state
  const [modal, setModal] = useState({ open: false, title: '', message: '', type: 'confirm', onConfirm: null });

  const activeSessionRef = useRef(null);
  const messagesEndRef = useRef(null);

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
            fontSize: '0.88rem',
            paddingLeft: isListItem ? '1.2rem' : '0',
            textIndent: isListItem ? '-1.2rem' : '0'
          }}
        >
          {formattedLine}
        </div>
      );
    });
  };

  // Pollers
  const sessionPoller = useRef(null);
  const messagePoller = useRef(null);

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

  // Load session list
  const loadSessions = async () => {
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
        setSessions(data);
      }
    } catch (err) {
      console.error('Error loading chat sessions:', err);
    }
  };

  // Load messages for specific session
  const selectSession = async (session) => {
    setActiveSession(session);
    activeSessionRef.current = session;
    setLoading(true);

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/chat/${session.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        
        // Refresh session details
        setActiveSession(data.session);
        activeSessionRef.current = data.session;

        // Clear any unread counts on the selected session locally
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, unread_count: 0 } : s));
      }
    } catch (err) {
      console.error('Error loading session messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Poll active session messages
  const pollActiveSessionMessages = async () => {
    const session = activeSessionRef.current;
    if (!session) return;

    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/chat/${session.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Error polling active session messages:', err);
    }
  };

  // Poll sessions and active message list on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSessions();
    }, 0);
    sessionPoller.current = setInterval(loadSessions, 5000);

    return () => {
      clearTimeout(timer);
      if (sessionPoller.current) clearInterval(sessionPoller.current);
      if (messagePoller.current) clearInterval(messagePoller.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll active message list whenever active session changes
  useEffect(() => {
    if (messagePoller.current) {
      clearInterval(messagePoller.current);
      messagePoller.current = null;
    }

    if (activeSession) {
      messagePoller.current = setInterval(pollActiveSessionMessages, 3000);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession]);

  // Takeover chat
  const handleTakeover = async () => {
    if (!activeSession) return;
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/chat/${activeSession.id}/takeover`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession(data.session);
        activeSessionRef.current = data.session;
        pollActiveSessionMessages();
        loadSessions();
      }
    } catch (err) {
      console.error('Error taking over session:', err);
    }
  };

  // Send admin message
  const handleSend = async () => {
    if (!inputText.trim() || !activeSession) return;
    const token = getToken();
    if (!token) return;

    const content = inputText;
    setInputText('');

    // Optimistically add message
    const tempMsg = {
      id: Date.now(),
      sender_type: 'admin',
      content: content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const res = await fetch(`/api/admin/chat/${activeSession.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        pollActiveSessionMessages();
        loadSessions();
      }
    } catch (err) {
      console.error('Error sending admin message:', err);
    }
  };

  // Helper: show themed confirm modal
  const showConfirm = (title, message, onConfirm) => {
    setModal({ open: true, title, message, type: 'confirm', onConfirm });
  };

  // Helper: show themed alert modal
  const showAlert = (title, message) => {
    setModal({ open: true, title, message, type: 'alert', onConfirm: null });
  };

  const closeModal = () => setModal(m => ({ ...m, open: false }));

  // Selesaikan / Close Session
  const handleCloseSession = () => {
    if (!activeSession) return;
    showConfirm(
      lang === 'id' ? 'Selesaikan Sesi Chat' : 'End Chat Session',
      lang === 'id' 
        ? 'Apakah Anda yakin ingin menyelesaikan sesi obrolan ini? Bot AI akan kembali mengambil alih.'
        : 'Are you sure you want to end this chat session? The AI Bot will take over again.',
      async () => {
        closeModal();
        const token = getToken();
        if (!token) return;
        try {
          const res = await fetch(`/api/admin/chat/${activeSession.id}/close`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          });
          if (res.ok) {
            setActiveSession(null);
            activeSessionRef.current = null;
            setMessages([]);
            loadSessions();
          } else {
            const errBody = await res.text();
            console.error('Close session failed:', res.status, errBody);
            showAlert(
              lang === 'id' ? 'Gagal Menutup Sesi' : 'Failed to Close Session', 
              lang === 'id' ? `Terjadi kesalahan saat menutup sesi. Status: ${res.status}` : `An error occurred while closing the session. Status: ${res.status}`
            );
          }
        } catch (err) {
          console.error('Error closing chat session:', err);
          showAlert(
            lang === 'id' ? 'Error Jaringan' : 'Network Error', 
            lang === 'id' ? `Tidak dapat terhubung ke server: ${err.message}` : `Could not connect to server: ${err.message}`
          );
        }
      }
    );
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 120px)',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderRadius: '16px',
      overflow: 'hidden',
      border: isDark ? '1.5px solid rgba(234, 179, 8, 0.3)' : '1px solid #e2e8f0',
      fontFamily: 'Inter, sans-serif',
      boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.3)' : '0 10px 25px -5px rgba(0, 0, 0, 0.05)'
    }}>
      {/* Sessions list (Left Panel) */}
      <div style={{
        width: '320px',
        borderRight: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{ 
          padding: '1.25rem', 
          backgroundColor: isDark ? '#0f172a' : '#ffffff',
          borderBottom: '2px solid #eab308'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.025em' }}>
            {lang === 'id' ? 'Percakapan Masuk' : 'Incoming Chats'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#eab308', fontWeight: 600 }}>
            ⚡ Hybrid AI + Live Chat System
          </p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
              {lang === 'id' ? 'Tidak ada sesi chat aktif saat ini.' : 'No active chat sessions currently.'}
            </div>
          ) : (
            sessions.map(s => {
              const isActive = activeSession?.id === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => selectSession(s)}
                  style={{
                    padding: '0.9rem 1.1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: isActive ? (isDark ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'rgba(234, 179, 8, 0.06)') : 'transparent',
                    color: isActive ? (isDark ? '#ffffff' : '#0f172a') : (isDark ? '#ffffff' : '#1e293b'),
                    marginBottom: '6px',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: isActive ? (isDark ? '1.5px solid #eab308' : '1px solid #eab308') : '1px solid transparent',
                    boxShadow: isActive ? (isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(234, 179, 8, 0.08)') : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f8fafc';
                      e.currentTarget.style.border = isDark ? '1px solid rgba(234, 179, 8, 0.2)' : '1px solid #e2e8f0';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.border = '1px solid transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem', color: isDark ? '#ffffff' : '#0f172a', fontWeight: 700 }}>
                      {s.user?.name || `User ID: ${s.user_id}`}
                    </strong>
                    {s.unread_count > 0 && (
                      <span style={{
                        backgroundColor: '#eab308', color: '#0f172a', fontSize: '0.7rem',
                        fontWeight: 800, padding: '2px 8px', borderRadius: '10px',
                        boxShadow: '0 0 8px rgba(234, 179, 8, 0.4)'
                      }}>
                        {s.unread_count}
                      </span>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      color: isActive ? (isDark ? '#eab308' : '#0f172a') : (isDark ? '#cbd5e1' : '#64748b'), 
                      textOverflow: 'ellipsis', 
                      overflow: 'hidden', 
                      whiteSpace: 'nowrap', 
                      maxWidth: '140px',
                      fontWeight: isActive ? 600 : 400
                    }}>
                      {s.last_message_preview || (lang === 'id' ? 'Belum ada pesan' : 'No messages yet')}
                    </span>
                    {s.mode === 'waiting' ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', ...badgeStyle }}>{lang === 'id' ? 'Butuh Takeover ⚠️' : 'Takeover Needed ⚠️'}</span>
                    ) : s.mode === 'human' ? (
                      <span style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', ...badgeStyle }}>Live Chat 🟢</span>
                    ) : (
                      <span style={{ backgroundColor: '#fef9c3', color: '#b45309', border: '1px solid #fde68a', ...badgeStyle }}>AI active 🤖</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message & Actions area (Right Panel) */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
      }}>
        {activeSession ? (
          <>
            {/* Active Session Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.02em' }}>
                  {activeSession.user?.name}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: isDark ? '#cbd5e1' : '#475569', fontWeight: 500 }}>
                  {activeSession.user?.email} &nbsp;·&nbsp; Status: <strong style={{ 
                    color: activeSession.mode === 'waiting' ? '#ef4444' : activeSession.mode === 'human' ? '#15803d' : '#b45309',
                    backgroundColor: activeSession.mode === 'waiting' ? '#fee2e2' : activeSession.mode === 'human' ? '#dcfce7' : '#fef9c3',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem'
                  }}>
                    {activeSession.mode === 'waiting' 
                      ? (lang === 'id' ? 'MENUNGGU CS' : 'WAITING CS') 
                      : activeSession.mode === 'human' 
                        ? (lang === 'id' ? 'LIVE CHAT CS' : 'LIVE CS CHAT') 
                        : (lang === 'id' ? 'AI BOT AKTIF' : 'AI BOT ACTIVE')}
                  </strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                {(activeSession.mode === 'bot' || activeSession.mode === 'waiting') && (
                  <button
                    onClick={handleTakeover}
                    style={{
                      background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                      color: '#0f172a',
                      border: '1.5px solid #ca8a04',
                      borderRadius: '10px',
                      padding: '0.65rem 1.3rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(234, 179, 8, 0.25)',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      fontFamily: 'Inter, sans-serif'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 179, 8, 0.35)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(234, 179, 8, 0.25)';
                    }}
                  >
                    {lang === 'id' ? 'Take Over Chat (Eskalasi ke CS) 🙋' : 'Take Over Chat (Escalate to CS) 🙋'}
                  </button>
                )}

                {activeSession.mode === 'human' && (
                  <>
                    <span style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      backgroundColor: '#dcfce7', color: '#15803d',
                      fontSize: '0.8rem', fontWeight: 700, padding: '0.5rem 1rem',
                      borderRadius: '8px', border: '1px solid #bbf7d0'
                    }}>
                      {lang === 'id' ? 'Tim Live Chat Terkoneksi ✓' : 'Live Chat Team Connected ✓'}
                    </span>
                    <button
                      onClick={handleCloseSession}
                      style={{
                        background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                        color: '#ef4444',
                        border: '1px solid #fca5a5',
                        borderRadius: '10px',
                        padding: '0.65rem 1.3rem',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'}
                    >
                      {lang === 'id' ? 'Selesaikan Chat ✕' : 'End Chat ✕'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages box */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}>
              {loading ? (
                <div style={{ margin: 'auto', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>{lang === 'id' ? 'Memuat pesan...' : 'Loading messages...'}</div>
              ) : (
                messages.map(msg => {
                  const isUser = msg.sender_type === 'user';
                  const isSystem = msg.sender_type === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} style={{
                        alignSelf: 'center',
                        backgroundColor: 'rgba(234, 179, 8, 0.08)',
                        color: isDark ? '#eab308' : '#b45309',
                        border: isDark ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(234, 179, 8, 0.2)',
                        padding: '0.5rem 1.25rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        textAlign: 'center',
                        maxWidth: '85%',
                        boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.02)',
                        letterSpacing: '-0.01em'
                      }}>
                        💡 {msg.content}
                      </div>
                    );
                  }

                  const isAdminMsg = msg.sender_type === 'admin';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isUser ? 'flex-start' : 'flex-end',
                        maxWidth: '70%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{
                        background: isUser 
                          ? (isDark ? '#0f172a' : '#ffffff')
                          : isAdminMsg 
                            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
                            : (isDark ? 'rgba(234, 179, 8, 0.12)' : '#fef9c3'),
                        color: isUser 
                          ? (isDark ? '#ffffff' : '#1e293b')
                          : isAdminMsg 
                            ? '#ffffff' 
                            : (isDark ? '#eab308' : '#713f12'),
                        padding: '0.8rem 1.1rem',
                        borderRadius: isUser ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                        boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.03)',
                        border: isUser 
                          ? (isDark ? '1.5px solid rgba(255, 255, 255, 0.15)' : '1.5px solid #e2e8f0')
                          : isAdminMsg 
                            ? '1.5px solid #eab308' 
                            : (isDark ? '1.5px solid rgba(234, 179, 8, 0.3)' : '1.5px solid #fde68a'),
                      }}>
                        {renderMessageContent(msg.content)}
                      </div>
                      <span style={{
                        fontSize: '0.65rem',
                        color: '#94a3b8',
                        marginTop: '4px',
                        alignSelf: isUser ? 'flex-start' : 'flex-end',
                        fontWeight: 500
                      }}>
                        {getSenderLabel(msg)} &nbsp;·&nbsp; {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div style={{
              padding: '1rem 1.5rem',
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center'
            }}>
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && activeSession.mode === 'human' && handleSend()}
                disabled={activeSession.mode !== 'human'}
                placeholder={activeSession.mode !== 'human' 
                  ? (lang === 'id' ? 'Gunakan tombol "Take Over Chat" di atas untuk dapat mengirim balasan manual.' : 'Use the "Take Over Chat" button above to reply manually.')
                  : (lang === 'id' ? 'Tulis balasan Anda di sini...' : 'Type your reply here...')}
                style={{
                  flex: 1,
                  padding: '0.8rem 1.2rem',
                  border: isDark ? '1.5px solid rgba(255, 255, 255, 0.15)' : '1.5px solid #cbd5e1',
                  borderRadius: '14px',
                  outline: 'none',
                  fontSize: '0.9rem',
                  color: isDark ? '#ffffff' : '#1e293b',
                  backgroundColor: activeSession.mode !== 'human' 
                    ? (isDark ? '#1e293b' : '#f8fafc') 
                    : (isDark ? '#0f172a' : '#ffffff'),
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => {
                  if (activeSession.mode === 'human') e.target.style.borderColor = '#eab308';
                }}
                onBlur={e => {
                  e.target.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : '#cbd5e1';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!inputText.trim() || activeSession.mode !== 'human'}
                style={{
                  background: activeSession.mode === 'human' 
                    ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
                    : (isDark ? '#334155' : '#cbd5e1'),
                  color: 'white',
                  border: activeSession.mode === 'human' ? '1.5px solid #eab308' : 'none',
                  borderRadius: '14px',
                  padding: '0.8rem 1.8rem',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  opacity: (!inputText.trim() || activeSession.mode !== 'human') ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: activeSession.mode === 'human' ? (isDark ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(15,23,42,0.15)') : 'none'
                }}
                onMouseEnter={e => {
                  if (activeSession.mode === 'human' && inputText.trim()) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={e => {
                  if (activeSession.mode === 'human') {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                {lang === 'id' ? 'Kirim' : 'Send'}
              </button>
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#64748b',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '28px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #eab308',
              color: '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)'
            }}>
              🎧
            </div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.25rem', color: isDark ? '#ffffff' : '#0f172a', letterSpacing: '-0.025em' }}>
              Wisma 46 Space Live Chat Dashboard
            </h4>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: isDark ? '#cbd5e1' : '#475569', maxWidth: '380px', lineHeight: '1.6' }}>
              {lang === 'id' 
                ? 'Silakan pilih obrolan aktif dari panel kiri untuk membalas pesan pelanggan, melakukan takeover, atau memonitor asisten virtual AI.'
                : 'Please select an active chat from the left panel to reply to customer messages, takeover chats, or monitor the AI virtual assistant.'}
            </p>
          </div>
        )}
      </div>
      {/* Custom Themed Modal */}
      {modal.open && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          backgroundColor: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.15s ease'
        }}>
          <div style={{
            background: isDark
              ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: isDark ? '1.5px solid rgba(234, 179, 8, 0.4)' : '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '28px 32px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: isDark
              ? '0 25px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(234,179,8,0.1)'
              : '0 25px 50px rgba(0,0,0,0.15)',
            fontFamily: 'Inter, sans-serif',
          }}>
            {/* Icon */}
            <div style={{
              width: '48px', height: '48px',
              borderRadius: '12px',
              background: modal.type === 'confirm'
                ? (isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2')
                : (isDark ? 'rgba(234,179,8,0.15)' : '#fef9c3'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', marginBottom: '16px'
            }}>
              {modal.type === 'confirm' ? '⚠️' : 'ℹ️'}
            </div>
            {/* Title */}
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '1.1rem', fontWeight: 800,
              color: isDark ? '#ffffff' : '#0f172a',
              letterSpacing: '-0.025em'
            }}>
              {modal.title}
            </h3>
            {/* Message */}
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '0.88rem',
              color: isDark ? '#cbd5e1' : '#64748b',
              lineHeight: '1.6'
            }}>
              {modal.message}
            </p>
            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {modal.type === 'confirm' && (
                <button
                  onClick={closeModal}
                  style={{
                    padding: '0.6rem 1.4rem',
                    borderRadius: '10px',
                    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #e2e8f0',
                    background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {lang === 'id' ? 'Batal' : 'Cancel'}
                </button>
              )}
              <button
                onClick={modal.type === 'confirm' ? modal.onConfirm : closeModal}
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: modal.type === 'confirm'
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  color: '#ffffff',
                  fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                  boxShadow: modal.type === 'confirm'
                    ? '0 4px 12px rgba(239,68,68,0.35)'
                    : '0 4px 12px rgba(234,179,8,0.35)',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {modal.type === 'confirm' 
                  ? (lang === 'id' ? 'Ya, Selesaikan' : 'Yes, End Session')
                  : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const badgeStyle = {
  fontSize: '0.65rem',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '6px',
  whiteSpace: 'nowrap'
};

export default AdminChat;

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Loader2, WifiOff } from 'lucide-react';

interface ChatMessage {
  id: string;
  content: string;
  sender_id: string;
  is_read: boolean;
  created_at: string;
  is_me: boolean;
}

export default function ChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAdmin = profile?.is_admin;

  // Don't show chat widget for admins (they use the admin dashboard chat panel)
  if (!user || isAdmin) return null;

  async function fetchMessages() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Fetch messages error:', error);
        if (error.message?.includes('does not exist')) {
          setError('Chat table not found. Please run the database migration first.');
        } else {
          setError('Failed to load messages: ' + error.message);
        }
      } else if (data) {
        const formatted = (data as any[]).map((m) => ({
          ...m,
          is_me: m.sender_id === user.id,
        }));
        setMessages(formatted);
        const unread = formatted.filter((m) => !m.is_me && !m.is_read).length;
        setUnreadCount(unread);
      }
    } catch (err: any) {
      console.error('Network error fetching messages:', err);
      setError('Network error. Check your connection and Supabase config.');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (user && isOpen) {
      fetchMessages();
      markAllAsRead();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!user) return;

    let channel: any;
    try {
      channel = supabase
        .channel('user-messages-' + user.id)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            const newMsg = payload.new as any;
            const formatted = {
              ...newMsg,
              is_me: newMsg.sender_id === user.id,
            };
            setMessages((prev) => [...prev, formatted]);
            if (!formatted.is_me) {
              setUnreadCount((prev) => prev + 1);
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.error('Subscription error:', err);
    }

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, [user]);

  async function markAllAsRead() {
    if (!user) return;
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .neq('sender_id', user.id)
        .eq('is_read', false);
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark read error:', err);
    }
  }

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    setError(null);
    try {
      const { error } = await supabase.from('messages').insert({
        user_id: user.id,
        sender_id: user.id,
        content: newMessage.trim(),
      });

      if (error) {
        console.error('Send message error:', error);
        if (error.message?.includes('does not exist')) {
          setError('Chat table not found. Run the database migration (003_chat_messages.sql).');
        } else if (error.message?.includes('row-level security')) {
          setError('Permission denied. Check RLS policies in Supabase.');
        } else {
          setError('Failed to send: ' + error.message);
        }
      }
    } catch (err: any) {
      console.error('Network error sending message:', err);
      setError('Network error. Check your Supabase connection.');
    }

    setNewMessage('');
    setSending(false);
    inputRef.current?.focus();
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            markAllAsRead();
            if (error) setError(null);
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-300 flex items-center justify-center hover:scale-110 transition-transform duration-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] h-[500px] max-h-[calc(100vh-120px)] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-bold">Support Chat</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded-full p-1 transition">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center gap-2 shrink-0">
              <WifiOff className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {loading && messages.length === 0 ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p>{error ? 'Fix the error above, then try again.' : 'Start a conversation with our support team!'}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.is_me
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${msg.is_me ? 'text-indigo-200' : 'text-gray-400'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="rounded-xl h-10"
              disabled={sending}
            />
            <Button
              type="submit"
              size="sm"
              className="rounded-xl h-10 px-3 bg-indigo-600 hover:bg-indigo-700"
              disabled={sending || !newMessage.trim()}
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}

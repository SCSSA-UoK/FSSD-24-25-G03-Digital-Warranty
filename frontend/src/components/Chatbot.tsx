import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  ChevronRight,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  chatApi,
} from '../api';
import { useAuth } from '../context/AuthContext';

interface ChatAction {
  label: string;
  path: string;
  id?: string;
  summary?: string;
}

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  actions?: ChatAction[];
}

function getInitialMessage(role?: string) {
  if (role === 'CUSTOMER') {
    return 'I can help with warranties, purchase linking, claims, and account navigation.';
  }
  if (role === 'RETAILER') {
    return 'I can help with POS billing, products, purchases, claims, and your retailer account.';
  }
  if (role === 'ADMIN') {
    return 'I can help with retailer approvals, customer accounts, platform claims, analytics, and audit logs.';
  }
  return 'I can help you understand WarranTrack and find the right account or warranty option.';
}

function getSuggestedPrompts(role?: string) {
  if (role === 'CUSTOMER') {
    return ['Show my warranty summary', 'How do I submit a claim?', 'Find and link purchases'];
  }
  if (role === 'RETAILER') {
    return ['Show my store summary', 'How do I create a bill?', 'How do I process claims?'];
  }
  if (role === 'ADMIN') {
    return ['Show platform summary', 'How do I approve a retailer?', 'What are audit logs?'];
  }
  return ['How do I verify a warranty?', 'How do I submit a claim?', 'How does retailer registration work?'];
}

export const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<ChatAction | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: 'assistant', text: getInitialMessage(user?.role) },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([{ id: Date.now(), role: 'assistant', text: getInitialMessage(user?.role) }]);
  }, [user?.role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const prompts = useMemo(() => getSuggestedPrompts(user?.role), [user?.role]);

  const sendQuestion = (question = input) => {
    const cleaned = question.trim();
    if (!cleaned || loading || pendingAction) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), role: 'user', text: cleaned },
    ]);
    setInput('');
    setLoading(true);
    setPendingAction(null);

    const history = messages
      .slice(-12)
      .map((message) => ({ role: message.role, content: message.text }));

    void chatApi.sendMessage(cleaned, history)
      .then((answer) => {
        const actions = (answer.navigationActions || []).map((action) => ({
          label: action.label,
          path: action.path || '/',
          id: action.id,
          summary: action.summary,
        }));
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: answer.message,
            actions,
          },
        ]);
        if (answer.pendingAction) {
          setPendingAction({
            id: answer.pendingAction.id,
            label: answer.pendingAction.label,
            path: answer.pendingAction.path || '/',
            summary: answer.pendingAction.summary,
          });
        }
      })
      .catch(() => {
        setMessages((current) => [
          ...current,
          {
            id: Date.now() + 1,
            role: 'assistant',
            text: 'The assistant is temporarily unavailable. Please try again or use the page navigation.',
          },
        ]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      {open && (
        <aside
          className="fixed z-[80] bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-3 sm:right-5 w-[calc(100vw-1.5rem)] sm:w-[380px] h-[min(620px,calc(100vh-7rem))] bg-[#EDF4EC] dark:bg-[#10291B] border border-[#AFC7AE] dark:border-[#245D3B] rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
          aria-label="WarranTrack assistant"
        >
          <header className="flex items-center justify-between px-4 py-3.5 border-b border-[#BDD0BC] dark:border-[#245D3B] bg-[#17432A] text-[#F3F7F2]">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#86E4AE] text-[#17432A] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-serif text-base font-bold leading-tight">WarranTrack Assistant</div>
                <div className="text-[11px] text-[#C8E1D1] truncate">
                  {user ? `${user.role.toLowerCase()} portal` : 'website guide'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-2 rounded-xl text-[#DCE9DF] hover:bg-white/10 transition cursor-pointer"
              aria-label="Close assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3.5 py-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-[#17432A] text-[#F3F7F2] rounded-br-md'
                      : 'bg-[#DCE8DB] dark:bg-[#173824] text-[#183525] dark:text-[#E4EEE6] border border-[#BDD0BC] dark:border-[#245D3B] rounded-bl-md'
                  }`}
                >
                  <p>{message.text}</p>
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {message.actions.map((action) => (
                        <button
                          type="button"
                          key={`${action.path}-${action.label}`}
                          onClick={() => {
                            navigate(action.path);
                            setOpen(false);
                          }}
                          className="w-full flex items-center justify-between gap-2 rounded-xl px-3 py-2 bg-[#F3F7F2] dark:bg-[#10291B] text-[#17432A] dark:text-[#86E4AE] border border-[#BFD1BE] dark:border-[#2D6545] text-xs font-bold hover:border-[#17432A] dark:hover:border-[#86E4AE] transition cursor-pointer"
                        >
                          <span>{action.label}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-[#DCE8DB] dark:bg-[#173824] border border-[#BDD0BC] dark:border-[#245D3B] text-xs text-[#476B53] dark:text-[#A7C8B4]">
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Preparing an answer
                </div>
              </div>
            )}
          </div>

          <div className="px-3.5 pb-3.5 pt-2 border-t border-[#BDD0BC] dark:border-[#245D3B] bg-[#EDF4EC] dark:bg-[#10291B]">
            {pendingAction && (
              <div className="mb-2.5 rounded-2xl border border-[#9AB49A] dark:border-[#3A7050] bg-[#DCE8DB] dark:bg-[#173824] p-3">
                <p className="text-xs font-semibold text-[#183525] dark:text-[#E4EEE6] mb-2.5">
                  {pendingAction.summary || pendingAction.label}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (!pendingAction.id) return;
                      setLoading(true);
                      void chatApi.confirmAction(pendingAction.id)
                        .then((result) => {
                          setMessages((current) => [
                            ...current,
                            { id: Date.now(), role: 'assistant', text: result.message },
                          ]);
                          setPendingAction(null);
                        })
                        .catch(() => {
                          setMessages((current) => [
                            ...current,
                            { id: Date.now(), role: 'assistant', text: 'That action could not be confirmed or its confirmation expired.' },
                          ]);
                          setPendingAction(null);
                        })
                        .finally(() => setLoading(false));
                    }}
                    className="flex-1 rounded-xl bg-[#17432A] text-[#F3F7F2] px-3 py-2 text-xs font-bold hover:bg-[#113521] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      if (pendingAction.id) {
                        void chatApi.cancelAction(pendingAction.id).catch(() => undefined);
                      }
                      setPendingAction(null);
                    }}
                    className="flex-1 rounded-xl border border-[#9AB49A] dark:border-[#3A7050] text-[#315640] dark:text-[#C7DCCB] px-3 py-2 text-xs font-bold hover:bg-[#DCE8DB] dark:hover:bg-[#214932] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {messages.length <= 2 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {prompts.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    onClick={() => sendQuestion(prompt)}
                    className="shrink-0 rounded-full border border-[#B5CBB4] bg-[#DFEBDE] dark:bg-[#173824] px-3 py-1.5 text-[11px] font-semibold text-[#315640] dark:text-[#C7DCCB] hover:border-[#17432A] dark:hover:border-[#86E4AE] transition cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                sendQuestion();
              }}
              className="flex items-end gap-2"
            >
              <label className="sr-only" htmlFor="warrantrack-chat-input">
                Ask the WarranTrack assistant
              </label>
              <textarea
                id="warrantrack-chat-input"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={Boolean(pendingAction)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendQuestion();
                  }
                }}
                rows={1}
                maxLength={500}
                placeholder="Ask about WarranTrack..."
                className="min-h-[42px] max-h-24 flex-1 resize-none rounded-2xl px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || Boolean(pendingAction)}
                className="w-[42px] h-[42px] rounded-2xl bg-[#17432A] text-[#86E4AE] flex items-center justify-center disabled:opacity-45 disabled:cursor-not-allowed hover:bg-[#113521] transition cursor-pointer"
                aria-label="Send message"
              >
                <Send className="w-[18px] h-[18px]" />
              </button>
            </form>
          </div>
        </aside>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="fixed z-[79] bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-3 sm:right-5 w-14 h-14 rounded-full bg-[#17432A] text-[#F3F7F2] border-2 border-[#86E4AE]/70 shadow-xl flex items-center justify-center hover:bg-[#113521] hover:scale-[1.03] transition-all cursor-pointer"
        aria-label={open ? 'Close WarranTrack assistant' : 'Open WarranTrack assistant'}
        aria-expanded={open}
      >
        {open ? <X className="w-6 h-6" /> : (
          <>
            <MessageCircle className="w-6 h-6" />
            <Sparkles className="absolute w-3 h-3 right-2 top-2 text-[#86E4AE]" />
          </>
        )}
      </button>
    </>
  );
};

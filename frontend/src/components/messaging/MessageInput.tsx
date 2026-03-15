import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Smile } from 'lucide-react';
import { clsx } from 'clsx';
import { messagingApi } from '@/api/messaging';
import { useToast } from '@/components/ui/Toast';

interface MessageInputProps {
  conversationId: string;
  onSent?: () => void;
}

const EMOJI_LIST = ['😊', '👍', '❤️', '🎵', '🎶', '🎹', '🎸', '🥁', '🎺', '🎻', '👏', '🙏'];

export const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onSent }) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      messagingApi.sendMessage(conversationId, { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setContent('');
      onSent?.();
      textareaRef.current?.focus();
    },
    onError: () => toast.error('Send failed', 'Could not send the message.'),
  });

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
      <div className="relative flex items-end gap-2">
        <div className="relative flex-1">
          {/* Emoji picker */}
          {showEmoji && (
            <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-3">
              <div className="grid grid-cols-6 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="text-xl p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-end bg-gray-100 dark:bg-gray-800 rounded-2xl px-3 py-2 gap-2">
            <button
              type="button"
              onClick={() => setShowEmoji(!showEmoji)}
              className={clsx(
                'flex-shrink-0 p-0.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors',
                showEmoji && 'text-primary-500'
              )}
            >
              <Smile className="h-5 w-5" />
            </button>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={autoResize}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              data-testid="message-input"
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 leading-relaxed max-h-28 overflow-y-auto"
              style={{ minHeight: '24px' }}
            />
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={!content.trim() || sendMutation.isPending}
          data-testid="send-message-btn"
          className={clsx(
            'flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full transition-all',
            content.trim()
              ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 pl-1">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

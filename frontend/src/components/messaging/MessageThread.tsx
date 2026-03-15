import React, { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isToday, isYesterday } from 'date-fns';
import { clsx } from 'clsx';
import { MoreHorizontal, Trash2, Edit2, Check, CheckCheck } from 'lucide-react';
import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import { messagingApi, MessagesResponse } from '@/api/messaging';
import { Message, Conversation } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { MessageInput } from './MessageInput';

interface MessageThreadProps {
  conversation: Conversation;
  currentUserId: string;
}

function groupMessageDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'MMMM d, yyyy');
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversation,
  currentUserId,
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteQuery<MessagesResponse, Error, { pages: MessagesResponse[] }, ['messages', string], string | undefined>({
      queryKey: ['messages', conversation.id],
      queryFn: ({ pageParam }) =>
        messagingApi.getMessages(conversation.id, {
          cursor: pageParam,
          limit: 30,
        }),
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    });

  const deleteMutation = useMutation({
    mutationFn: (messageId: string) =>
      messagingApi.deleteMessage(conversation.id, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      toast.success('Message deleted');
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) =>
      messagingApi.editMessage(conversation.id, messageId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      setEditingId(null);
      setEditContent('');
    },
    onError: () => toast.error('Edit failed'),
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [data?.pages]);

  // Infinite scroll up
  const handleScroll = () => {
    if (!containerRef.current) return;
    if (containerRef.current.scrollTop < 80 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  const messages: Message[] = React.useMemo(() => {
    if (!data) return [];
    return [...data.pages].reverse().flatMap((page) => [...page.messages].reverse());
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">Could not load messages.</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateLabel = groupMessageDateLabel(msg.createdAt);
    const existing = groupedMessages.find((g) => g.date === dateLabel);
    if (existing) {
      existing.messages.push(msg);
    } else {
      groupedMessages.push({ date: dateLabel, messages: [msg] });
    }
  });

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1"
      >
        {isFetchingNextPage && (
          <div className="flex justify-center py-2">
            <Spinner size="sm" />
          </div>
        )}

        {groupedMessages.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium px-2">
                {group.date}
              </span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            </div>

            {group.messages.map((message, index) => {
              const isOwn = message.senderId === currentUserId;
              const prevMsg = group.messages[index - 1];
              const isSameAuthor = prevMsg?.senderId === message.senderId;
              const senderProfile = message.sender?.profile;
              const senderName = senderProfile
                ? `${senderProfile.firstName} ${senderProfile.lastName}`
                : message.sender?.email || 'Unknown';

              return (
                <div
                  key={message.id}
                  className={clsx(
                    'flex gap-2 group',
                    isOwn ? 'flex-row-reverse' : 'flex-row',
                    isSameAuthor ? 'mt-0.5' : 'mt-3'
                  )}
                >
                  {!isOwn && (
                    <div className="flex-shrink-0 mt-auto">
                      {!isSameAuthor ? (
                        <Avatar name={senderName} size="sm" src={senderProfile?.avatarUrl} />
                      ) : (
                        <div className="w-8" />
                      )}
                    </div>
                  )}

                  <div className={clsx('max-w-[70%] flex flex-col', isOwn && 'items-end')}>
                    {!isSameAuthor && !isOwn && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 ml-1 font-medium">
                        {senderName}
                      </span>
                    )}

                    <div className="flex items-end gap-1 group">
                      {/* Message actions */}
                      {!message.deletedAt && (
                        <RadixDropdown.Root>
                          <RadixDropdown.Trigger asChild>
                            <button
                              className={clsx(
                                'opacity-0 group-hover:opacity-100 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all',
                                isOwn ? 'order-first' : 'order-last'
                              )}
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </button>
                          </RadixDropdown.Trigger>
                          <RadixDropdown.Portal>
                            <RadixDropdown.Content
                              className="z-50 min-w-[120px] bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-1"
                              sideOffset={4}
                            >
                              {isOwn && (
                                <RadixDropdown.Item
                                  className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 outline-none"
                                  onSelect={() => {
                                    setEditingId(message.id);
                                    setEditContent(message.content);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Edit
                                </RadixDropdown.Item>
                              )}
                              <RadixDropdown.Item
                                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 outline-none"
                                onSelect={() => deleteMutation.mutate(message.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </RadixDropdown.Item>
                            </RadixDropdown.Content>
                          </RadixDropdown.Portal>
                        </RadixDropdown.Root>
                      )}

                      {/* Bubble */}
                      <div
                        className={clsx(
                          'px-3.5 py-2 rounded-2xl text-sm leading-relaxed',
                          isOwn
                            ? 'bg-primary-600 text-white rounded-br-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm',
                          message.deletedAt && 'opacity-50 italic'
                        )}
                      >
                        {editingId === message.id ? (
                          <div className="flex items-end gap-2 min-w-[200px]">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="flex-1 bg-transparent resize-none outline-none text-sm text-white min-h-[40px]"
                              autoFocus
                              rows={2}
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() =>
                                  editMutation.mutate({
                                    messageId: message.id,
                                    content: editContent,
                                  })
                                }
                                className="text-xs bg-white text-primary-600 rounded px-1.5 py-0.5 font-medium"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs text-white/80 hover:text-white"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {message.deletedAt ? (
                              <em className="text-gray-400">Message deleted</em>
                            ) : (
                              message.content
                            )}
                            {message.editedAt && !message.deletedAt && (
                              <span className="ml-1 text-xs opacity-60">(edited)</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className={clsx(
                        'flex items-center gap-1 mt-0.5 text-xs text-gray-400 dark:text-gray-500',
                        isOwn && 'flex-row-reverse'
                      )}
                    >
                      <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                      {isOwn && <CheckCheck className="h-3 w-3 text-gray-400" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <MessageInput conversationId={conversation.id} />
    </div>
  );
};

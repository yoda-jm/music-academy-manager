import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare } from 'lucide-react';
import { messagingApi } from '@/api/messaging';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { Conversation, Message } from '@/types';
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { NewConversationDialog } from '@/components/messaging/NewConversationDialog';
import { Button } from '@/components/ui/Button';

export default function MessagingPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const { on } = useSocket();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: messagingApi.getConversations,
  });

  // Listen for new messages via socket
  useEffect(() => {
    const unsubscribe = on('message', (data) => {
      const message = data as Message;
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', message.conversationId] });
    });
    return unsubscribe;
  }, [on, queryClient]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    // Mark as read
    messagingApi.markConversationRead(conv.id).catch(() => {});
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      {/* Conversation list */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowNewConv(true)}
          >
            New
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations || []}
            isLoading={isLoading}
            selectedId={selectedConversation?.id}
            onSelect={handleSelectConversation}
            currentUserId={user?.id}
          />
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && user ? (
          <MessageThread
            conversation={selectedConversation}
            currentUserId={user.id}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
            <MessageSquare className="h-12 w-12" />
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
          </div>
        )}
      </div>

      <NewConversationDialog
        open={showNewConv}
        onOpenChange={setShowNewConv}
        onCreated={(convId) => {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }}
      />
    </div>
  );
}

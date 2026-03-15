import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Users, Megaphone } from 'lucide-react';
import { clsx } from 'clsx';
import { Conversation, ConvType } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface ConversationListProps {
  conversations: Conversation[];
  isLoading?: boolean;
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  currentUserId?: string;
}

function getConversationIcon(type: ConvType) {
  switch (type) {
    case ConvType.GROUP:
      return <Users className="h-5 w-5 text-blue-500" />;
    case ConvType.ANNOUNCEMENT:
      return <Megaphone className="h-5 w-5 text-amber-500" />;
    default:
      return <MessageSquare className="h-5 w-5 text-gray-400" />;
  }
}

function getConversationName(
  conv: Conversation,
  currentUserId?: string
): string {
  if (conv.name) return conv.name;
  if (conv.type === ConvType.DIRECT) {
    const other = conv.participants?.find((p) => p.userId !== currentUserId);
    if (other?.user?.profile) {
      return `${other.user.profile.firstName} ${other.user.profile.lastName}`;
    }
    return other?.user?.email || 'Direct Message';
  }
  return `Group (${conv.participants?.length || 0})`;
}

function getParticipantAvatarName(conv: Conversation, currentUserId?: string): string {
  if (conv.type === ConvType.DIRECT) {
    const other = conv.participants?.find((p) => p.userId !== currentUserId);
    if (other?.user?.profile) {
      return `${other.user.profile.firstName} ${other.user.profile.lastName}`;
    }
  }
  return conv.name || 'Group';
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  currentUserId,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-gray-400">
        <MessageSquare className="h-10 w-10 mb-3" />
        <p className="text-sm font-medium">No conversations yet</p>
        <p className="text-xs mt-1">Start a new conversation to get started</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-800">
      {conversations.map((conv) => {
        const isSelected = conv.id === selectedId;
        const name = getConversationName(conv, currentUserId);
        const avatarName = getParticipantAvatarName(conv, currentUserId);
        const hasUnread = (conv.unreadCount || 0) > 0;
        const lastMsg = conv.lastMessage;

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv)}
            data-testid="conversation-item"
            className={clsx(
              'w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors',
              isSelected
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'hover:bg-gray-50 dark:hover:bg-gray-800/60'
            )}
          >
            <div className="relative flex-shrink-0">
              {conv.type === ConvType.DIRECT ? (
                <Avatar name={avatarName} size="md" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {getConversationIcon(conv.type)}
                </div>
              )}
              {hasUnread && (
                <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary-600 border-2 border-white dark:border-gray-900" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={clsx(
                    'text-sm truncate',
                    hasUnread
                      ? 'font-semibold text-gray-900 dark:text-gray-100'
                      : 'font-medium text-gray-800 dark:text-gray-200'
                  )}
                >
                  {name}
                </span>
                <span className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {conv.lastMessage?.createdAt
                    ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: false })
                    : conv.updatedAt
                    ? formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: false })
                    : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                <p
                  className={clsx(
                    'text-xs flex-1 truncate',
                    hasUnread
                      ? 'text-gray-700 dark:text-gray-300 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {lastMsg
                    ? lastMsg.deletedAt
                      ? 'Message deleted'
                      : lastMsg.content
                    : 'No messages yet'}
                </p>
                {hasUnread && (
                  <span className="flex-shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center">
                    {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

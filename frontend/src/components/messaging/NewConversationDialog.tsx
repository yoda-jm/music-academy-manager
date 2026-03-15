import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/api/users';
import { messagingApi } from '@/api/messaging';
import { ConvType, User } from '@/types';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/SearchInput';
import { useToast } from '@/components/ui/Toast';
import { X } from 'lucide-react';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (conversationId: string) => void;
}

export const NewConversationDialog: React.FC<NewConversationDialogProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [type, setType] = useState<ConvType>(ConvType.DIRECT);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [initialMessage, setInitialMessage] = useState('');

  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['users', { search, limit: 10 }],
    queryFn: () => usersApi.getUsers({ page: 1, limit: 10, search }),
    enabled: !!search && search.length > 1,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      messagingApi.createConversation({
        type,
        title: type !== ConvType.DIRECT ? title : undefined,
        participantIds: selectedUsers.map((u) => u.id),
        initialMessage: initialMessage || undefined,
      }),
    onSuccess: (data) => {
      toast.success('Conversation started');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      onCreated?.(data.id);
      onOpenChange(false);
      resetForm();
    },
    onError: () => toast.error('Error', 'Could not create conversation.'),
  });

  const resetForm = () => {
    setType(ConvType.DIRECT);
    setTitle('');
    setSearch('');
    setSelectedUsers([]);
    setInitialMessage('');
  };

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) => {
      const exists = prev.find((u) => u.id === user.id);
      if (exists) return prev.filter((u) => u.id !== user.id);
      if (type === ConvType.DIRECT) return [user];
      return [...prev, user];
    });
  };

  const getUserName = (u: User) => {
    if (u.profile) return `${u.profile.firstName} ${u.profile.lastName}`;
    return u.email;
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="New Conversation"
      size="md"
    >
      <div className="space-y-4">
        <Select
          label="Type"
          options={[
            { value: ConvType.DIRECT, label: 'Direct Message' },
            { value: ConvType.GROUP, label: 'Group Conversation' },
          ]}
          value={type}
          onValueChange={(v) => {
            setType(v as ConvType);
            if (v === ConvType.DIRECT) setSelectedUsers(selectedUsers.slice(0, 1));
          }}
        />

        {type !== ConvType.DIRECT && (
          <Input
            label="Conversation Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Piano Students Group"
            required
          />
        )}

        {/* Selected users */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm px-2 py-1 rounded-full"
              >
                <Avatar name={getUserName(user)} size="xs" src={user.profile?.avatarUrl} />
                <span className="font-medium">{getUserName(user)}</span>
                <button
                  onClick={() => toggleUser(user)}
                  className="text-primary-500 hover:text-primary-700 ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* User search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {type === ConvType.DIRECT ? 'Search recipient' : 'Add participants'}
          </label>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or email..."
          />
          {usersData && usersData.data.length > 0 && (
            <div className="mt-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
              {usersData.data.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id);
                return (
                  <button
                    key={user.id}
                    onClick={() => toggleUser(user)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Avatar name={getUserName(user)} size="sm" src={user.profile?.avatarUrl} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {getUserName(user)}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-xs text-primary-600 font-medium">Selected</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Input
          label="First message (optional)"
          placeholder="Say hello..."
          value={initialMessage}
          onChange={(e) => setInitialMessage(e.target.value)}
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => createMutation.mutate()}
            disabled={selectedUsers.length === 0}
            isLoading={createMutation.isPending}
          >
            Start Conversation
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
};

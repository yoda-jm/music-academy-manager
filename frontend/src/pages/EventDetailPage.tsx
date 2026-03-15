import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, MapPin, Users, Paperclip, ArrowLeft, Edit2, Plus,
  Trash2, Download, Upload, User as UserIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { eventsApi, AddParticipantData } from '@/api/events';
import { EventParticipantRole, EventFileType, Role } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import { EventForm } from '@/components/events/EventForm';
import { useSetBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { usersApi } from '@/api/users';

const participantRoleOptions = Object.values(EventParticipantRole).map((r) => ({
  value: r,
  label: r.charAt(0) + r.slice(1).toLowerCase(),
}));

const fileTypeOptions = Object.values(EventFileType).map((t) => ({
  value: t,
  label: t.charAt(0) + t.slice(1).toLowerCase(),
}));

const fileTypeLabels: Record<EventFileType, string> = {
  [EventFileType.PROGRAM]: 'Program',
  [EventFileType.AFFICHE]: 'Affiche/Poster',
  [EventFileType.PLAYLIST]: 'Playlist',
  [EventFileType.SPEECH]: 'Speech',
  [EventFileType.OTHER]: 'Other',
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;

  const [tab, setTab] = useState<'participants' | 'files'>('participants');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showAddParticipant, setShowAddParticipant] = useState(false);
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null);
  const [removingFileId, setRemovingFileId] = useState<string | null>(null);
  const [participantUserId, setParticipantUserId] = useState('');
  const [participantRole, setParticipantRole] = useState<EventParticipantRole>(EventParticipantRole.ATTENDEE);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [debouncedUserSearch, setDebouncedUserSearch] = useState('');
  const [selectedUserName, setSelectedUserName] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedUserSearch(userSearchQuery), 300);
    return () => clearTimeout(t);
  }, [userSearchQuery]);
  const [uploadFileType, setUploadFileType] = useState<EventFileType>(EventFileType.OTHER);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: event, isLoading } = useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getEvent(id!),
    enabled: !!id,
  });

  useSetBreadcrumb(id, event?.name);

  const { data: userSearchResults } = useQuery({
    queryKey: ['users', 'search', debouncedUserSearch],
    queryFn: () => usersApi.searchUsers(debouncedUserSearch),
    enabled: debouncedUserSearch.length >= 2,
    staleTime: 0,
  });

  const addParticipantMutation = useMutation({
    mutationFn: (data: AddParticipantData) => eventsApi.addParticipant(id!, data),
    onSuccess: () => {
      toast.success('Participant added');
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      setShowAddParticipant(false);
      setParticipantUserId('');
    },
    onError: () => toast.error('Error', 'Could not add participant.'),
  });

  const removeParticipantMutation = useMutation({
    mutationFn: (userId: string) => eventsApi.removeParticipant(id!, userId),
    onSuccess: () => {
      toast.success('Participant removed');
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      setRemovingParticipantId(null);
    },
    onError: () => toast.error('Error', 'Could not remove participant.'),
  });

  const uploadFileMutation = useMutation({
    mutationFn: ({ file, fileType }: { file: File; fileType: EventFileType }) =>
      eventsApi.uploadFile(id!, file, fileType),
    onSuccess: () => {
      toast.success('File uploaded');
      queryClient.invalidateQueries({ queryKey: ['events', id] });
    },
    onError: () => toast.error('Error', 'Could not upload file.'),
  });

  const removeFileMutation = useMutation({
    mutationFn: (fileId: string) => eventsApi.deleteFile(id!, fileId),
    onSuccess: () => {
      toast.success('File deleted');
      queryClient.invalidateQueries({ queryKey: ['events', id] });
      setRemovingFileId(null);
    },
    onError: () => toast.error('Error', 'Could not delete file.'),
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFileMutation.mutate({ file, fileType: uploadFileType });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  if (!event) return <p className="text-center text-gray-500 py-12">Event not found.</p>;

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const sameDay = format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd');

  const dateLabel = event.isAllDay
    ? (sameDay
        ? format(startDate, 'EEEE, MMMM d, yyyy')
        : `${format(startDate, 'EEEE, MMMM d')} — ${format(endDate, 'EEEE, MMMM d, yyyy')}`)
    : (sameDay
        ? `${format(startDate, 'EEEE, MMMM d, yyyy')} · ${format(startDate, 'HH:mm')} – ${format(endDate, 'HH:mm')}`
        : `${format(startDate, 'EEEE, MMM d, HH:mm')} — ${format(endDate, 'EEEE, MMM d, HH:mm, yyyy')}`);

  return (
    <div>
      <button onClick={() => navigate('/events')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </button>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100" data-testid="event-detail-title">{event.name}</h1>
          {event.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{event.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 mt-2">
            <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              {dateLabel}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="h-4 w-4" /> {event.location}
              </span>
            )}
            {event.isAllDay && <Badge variant="info" size="sm">All day</Badge>}
            {!event.isPublic && <Badge variant="gray" size="sm">Private</Badge>}
          </div>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" leftIcon={<Edit2 className="h-4 w-4" />} onClick={() => setShowEditForm(true)}>
            Edit
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-gray-200 dark:border-gray-700">
        {(['participants', 'files'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t === 'participants' ? <Users className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
            {t}
            <span className="ml-1 text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {t === 'participants' ? (event.participants?.length ?? 0) : (event.files?.length ?? 0)}
            </span>
          </button>
        ))}
      </div>

      {/* Participants tab */}
      {tab === 'participants' && (
        <Card>
          {isAdmin && (
            <Card.Header action={
              <Button size="sm" variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowAddParticipant(true)}>
                Add Participant
              </Button>
            }>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Participants</h2>
            </Card.Header>
          )}
          <Card.Body>
            {!event.participants?.length ? (
              <p className="text-sm text-gray-500 text-center py-6">No participants yet.</p>
            ) : (
              <div className="space-y-3">
                {event.participants.map((p) => {
                  const profile = p.user?.profile;
                  const name = profile ? `${profile.firstName} ${profile.lastName}` : p.user?.email || p.userId;
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{name}</p>
                        <p className="text-xs text-gray-500">{p.user?.email}</p>
                      </div>
                      <Badge variant="info" size="sm">{p.role}</Badge>
                      {isAdmin && (
                        <button onClick={() => setRemovingParticipantId(p.userId)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Files tab */}
      {tab === 'files' && (
        <Card>
          {isAdmin && (
            <Card.Header action={
              <div className="flex items-center gap-2">
                <Select
                  options={fileTypeOptions}
                  value={uploadFileType}
                  onValueChange={(v) => setUploadFileType(v as EventFileType)}
                  containerClassName="w-36"
                />
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={uploadFileMutation.isPending ? <Spinner size="sm" /> : <Upload className="h-4 w-4" />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadFileMutation.isPending}
                >
                  Upload
                </Button>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept="*/*" />
              </div>
            }>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Attachments</h2>
            </Card.Header>
          )}
          <Card.Body>
            {!event.files?.length ? (
              <p className="text-sm text-gray-500 text-center py-6">No files attached yet.</p>
            ) : (
              <div className="space-y-2">
                {event.files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700">
                    <Paperclip className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{f.name}</p>
                      <p className="text-xs text-gray-500">
                        {fileTypeLabels[f.fileType]}
                        {f.size && ` · ${(f.size / 1024).toFixed(0)} KB`}
                      </p>
                    </div>
                    <a href={f.fileUrl} target="_blank" rel="noreferrer" className="p-1 text-gray-400 hover:text-primary-600 rounded transition-colors" title="Download">
                      <Download className="h-4 w-4" />
                    </a>
                    {isAdmin && (
                      <button onClick={() => setRemovingFileId(f.id)} className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Edit event dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm} title="Edit Event" size="lg">
        <EventForm
          event={event}
          onSuccess={() => { setShowEditForm(false); queryClient.invalidateQueries({ queryKey: ['events', id] }); }}
          onCancel={() => setShowEditForm(false)}
        />
      </Dialog>

      {/* Add participant dialog */}
      <Dialog
        open={showAddParticipant}
        onOpenChange={(open) => {
          setShowAddParticipant(open);
          if (!open) {
            setUserSearchQuery('');
            setDebouncedUserSearch('');
            setSelectedUserName('');
            setParticipantUserId('');
          }
        }}
        title="Add Participant"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search user <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                value={selectedUserName || userSearchQuery}
                onChange={(e) => {
                  setUserSearchQuery(e.target.value);
                  setSelectedUserName('');
                  setParticipantUserId('');
                }}
                placeholder="Type a name or email…"
              />
              {!selectedUserName && debouncedUserSearch.length >= 2 && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {!userSearchResults?.length ? (
                    <p className="px-3 py-2 text-sm text-gray-500">No users found</p>
                  ) : (
                    userSearchResults.map((u) => {
                      const name = u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onMouseDown={() => {
                            setSelectedUserName(name || u.email);
                            setParticipantUserId(u.id);
                            setUserSearchQuery('');
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>
                          <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
          <Select
            label="Role"
            options={participantRoleOptions}
            value={participantRole}
            onValueChange={(v) => setParticipantRole(v as EventParticipantRole)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddParticipant(false)}>Cancel</Button>
            <Button
              variant="primary"
              isLoading={addParticipantMutation.isPending}
              onClick={() => addParticipantMutation.mutate({ userId: participantUserId, role: participantRole })}
              disabled={!participantUserId.trim()}
            >
              Add
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      <ConfirmDialog
        open={!!removingParticipantId}
        onOpenChange={(open) => !open && setRemovingParticipantId(null)}
        title="Remove Participant"
        description="Remove this participant from the event?"
        confirmLabel="Remove"
        onConfirm={() => removingParticipantId && removeParticipantMutation.mutate(removingParticipantId)}
        isLoading={removeParticipantMutation.isPending}
      />

      <ConfirmDialog
        open={!!removingFileId}
        onOpenChange={(open) => !open && setRemovingFileId(null)}
        title="Delete File"
        description="Permanently delete this file attachment?"
        confirmLabel="Delete"
        onConfirm={() => removingFileId && removeFileMutation.mutate(removingFileId)}
        isLoading={removeFileMutation.isPending}
      />
    </div>
  );
}


import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, Paperclip, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { eventsApi, CreateEventData } from '@/api/events';
import { Event } from '@/types';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { EventForm } from '@/components/events/EventForm';

export default function EventsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.SUPER_ADMIN;
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data: events, isLoading } = useQuery({
    queryKey: ['events', tab],
    queryFn: () => eventsApi.getEvents({ upcoming: tab === 'upcoming' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => eventsApi.deleteEvent(id),
    onSuccess: () => {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Error', 'Could not delete event.'),
  });

  const now = new Date();
  const displayedEvents = (events || []).filter((e) => {
    const eventDate = new Date(e.startDate);
    return tab === 'upcoming' ? eventDate >= now : eventDate < now;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Events</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Concerts, recitals, workshops and more
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>
            Create Event
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
        {(['upcoming', 'past'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : displayedEvents.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-12">
          No {tab} events.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isAdmin={isAdmin}
              onClick={() => navigate(`/events/${event.id}`)}
              onDelete={(e) => { e.stopPropagation(); setDeletingId(event.id); }}
            />
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm} title="Create Event" size="lg">
        <EventForm onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ['events'] }); }} onCancel={() => setShowForm(false)} />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Event"
        description="Are you sure? This will permanently delete the event and all its files."
        confirmLabel="Delete"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function EventCard({ event, isAdmin, onClick, onDelete }: {
  event: Event;
  isAdmin: boolean;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const sameDay = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd');

  const dateLabel = event.isAllDay
    ? (sameDay ? format(start, 'MMM d, yyyy') : `${format(start, 'MMM d')} — ${format(end, 'MMM d, yyyy')}`)
    : (sameDay
        ? `${format(start, 'MMM d, yyyy')} · ${format(start, 'HH:mm')}–${format(end, 'HH:mm')}`
        : `${format(start, 'MMM d HH:mm')} — ${format(end, 'MMM d HH:mm, yyyy')}`);

  return (
    <Card className="cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors" onClick={onClick} data-testid="event-card">
      <Card.Body>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-tight">
            {event.name}
          </h3>
          {isAdmin && (
            <button onClick={onDelete} className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{event.description}</p>
        )}

        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{dateLabel}</span>
            {event.isAllDay && <Badge variant="gray" size="sm">All day</Badge>}
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {event._count?.participants ?? event.participants?.length ?? 0} participants
          </span>
          <span className="flex items-center gap-1">
            <Paperclip className="h-3.5 w-3.5" />
            {event._count?.files ?? event.files?.length ?? 0} files
          </span>
          {!event.isPublic && <Badge variant="gray" size="sm">Private</Badge>}
        </div>
      </Card.Body>
    </Card>
  );
}

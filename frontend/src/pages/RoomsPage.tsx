import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, Users, DoorOpen, CalendarDays } from 'lucide-react';
import { roomsApi, CreateRoomData } from '@/api/rooms';
import { Room } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogFooter } from '@/components/ui/Dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.number({ invalid_type_error: 'Required' }).min(1),
  floor: z.string().optional(),
  equipment: z.string().optional(),
  color: z.string().optional(),
});

type FD = z.infer<typeof schema>;

function RoomForm({
  room,
  onSuccess,
  onCancel,
}: {
  room?: Room;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors } } = useForm<FD>({
    resolver: zodResolver(schema),
    defaultValues: room
      ? { name: room.name, capacity: room.capacity, floor: room.floor, equipment: room.equipment?.join(', '), color: room.color }
      : { capacity: 1 },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateRoomData) => roomsApi.createRoom(data),
    onSuccess: () => { toast.success('Room created'); queryClient.invalidateQueries({ queryKey: ['rooms'] }); onSuccess(); },
    onError: () => toast.error('Error', 'Could not create room.'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateRoomData>) => roomsApi.updateRoom(room!.id, data),
    onSuccess: () => { toast.success('Room updated'); queryClient.invalidateQueries({ queryKey: ['rooms'] }); onSuccess(); },
    onError: () => toast.error('Error', 'Could not update room.'),
  });

  const onSubmit = (data: FD) => {
    const payload = {
      ...data,
      equipment: data.equipment ? data.equipment.split(',').map((e) => e.trim()).filter(Boolean) : [],
    };
    room ? updateMutation.mutate(payload) : createMutation.mutate(payload as CreateRoomData);
  };
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input label="Room Name" {...register('name')} error={errors.name?.message} required />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Capacity" type="number" min="1" {...register('capacity', { valueAsNumber: true })} error={errors.capacity?.message} required />
        <Input label="Floor / Level" {...register('floor')} placeholder="e.g. 1st Floor" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Color (hex)" {...register('color')} placeholder="#4f46e5" />
      </div>
      <Input
        label="Equipment"
        {...register('equipment')}
        placeholder="Piano, Whiteboard, Projector"
        helperText="Comma-separated list of equipment"
      />
      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel} data-testid="cancel-room-btn">Cancel</Button>
        <Button type="submit" isLoading={isLoading} data-testid="submit-room-btn">{room ? 'Update Room' : 'Create Room'}</Button>
      </DialogFooter>
    </form>
  );
}

export default function RoomsPage() {
  const [formRoom, setFormRoom] = useState<Room | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['rooms', 'list'],
    queryFn: () => roomsApi.getRooms({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsApi.deleteRoom(id),
    onSuccess: () => {
      toast.success('Room deleted');
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setDeletingId(null);
    },
    onError: () => toast.error('Error', 'Could not delete room.'),
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rooms</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage practice and lesson rooms</p>
        </div>
        <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormRoom('new')} data-testid="add-room-btn">
          Add Room
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner size="xl" /></div>
      ) : !data?.data.length ? (
        <EmptyState
          icon={<DoorOpen className="h-8 w-8 text-gray-400" />}
          title="No rooms"
          description="Add your first room to start scheduling."
          action={{ label: 'Add Room', onClick: () => setFormRoom('new'), icon: <Plus className="h-4 w-4" /> }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {data.data.map((room) => (
            <div
              key={room.id}
              data-testid="room-card"
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: room.color ? `${room.color}20` : '#eef2ff' }}
                  >
                    <DoorOpen
                      className="h-5 w-5"
                      style={{ color: room.color || '#4f46e5' }}
                    />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{room.name}</h3>
                    {room.floor && (
                      <p className="text-xs text-gray-500">{room.floor}</p>
                    )}
                  </div>
                </div>
                <Badge variant={room.isActive ? 'success' : 'gray'} dot>
                  {room.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <Users className="h-4 w-4" />
                <span>Capacity: {room.capacity}</span>
              </div>

              {room.equipment && room.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {room.equipment.map((e) => (
                    <Badge key={e} variant="default" size="sm">{e}</Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<CalendarDays className="h-3.5 w-3.5" />}
                  onClick={() => navigate(`/calendar?room=${room.id}`)}
                  className="flex-1 text-primary-600 hover:bg-primary-50 dark:text-primary-400"
                  data-testid="room-calendar-btn"
                >
                  Calendar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                  onClick={() => setFormRoom(room)}
                  data-testid="room-edit-btn"
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setDeletingId(room.id)}
                  className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  data-testid="room-delete-btn"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog
        open={!!formRoom}
        onOpenChange={(open) => !open && setFormRoom(null)}
        title={formRoom === 'new' ? 'Add Room' : 'Edit Room'}
        size="md"
      >
        <RoomForm
          room={formRoom !== 'new' ? (formRoom as Room) : undefined}
          onSuccess={() => setFormRoom(null)}
          onCancel={() => setFormRoom(null)}
        />
      </Dialog>

      <ConfirmDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Room"
        description="Are you sure you want to delete this room? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deletingId && deleteMutation.mutate(deletingId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

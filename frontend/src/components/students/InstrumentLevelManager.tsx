import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Music } from 'lucide-react';
import { studentsApi, StudentInstrumentInput } from '@/api/students';
import { teachersApi, TeacherInstrumentInput } from '@/api/teachers';
import { InstrumentLevel, StudentInstrument, TeacherInstrument } from '@/types';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import apiClient from '@/api/client';

interface InstrumentLevelManagerProps {
  entityId: string;
  entityType: 'student' | 'teacher';
}

const levelLabels: Record<InstrumentLevel, string> = {
  [InstrumentLevel.BEGINNER]: 'Beginner (Initiation)',
  [InstrumentLevel.ELEMENTARY]: 'Elementary (Cycle 1)',
  [InstrumentLevel.INTERMEDIATE]: 'Intermediate (Cycle 2)',
  [InstrumentLevel.ADVANCED]: 'Advanced (Cycle 3)',
  [InstrumentLevel.PROFESSIONAL]: 'Professional',
};

const levelOptions = Object.values(InstrumentLevel).map((l) => ({
  value: l,
  label: levelLabels[l],
}));

const levelColors: Record<InstrumentLevel, string> = {
  [InstrumentLevel.BEGINNER]: 'info',
  [InstrumentLevel.ELEMENTARY]: 'success',
  [InstrumentLevel.INTERMEDIATE]: 'warning',
  [InstrumentLevel.ADVANCED]: 'orange',
  [InstrumentLevel.PROFESSIONAL]: 'purple',
};

export const InstrumentLevelManager: React.FC<InstrumentLevelManagerProps> = ({
  entityId,
  entityType,
}) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [newInstrumentId, setNewInstrumentId] = useState('');
  const [newLevel, setNewLevel] = useState<InstrumentLevel>(InstrumentLevel.BEGINNER);
  const [items, setItems] = useState<(StudentInstrument | TeacherInstrument)[]>([]);

  // Fetch all instruments
  const { data: allInstruments } = useQuery({
    queryKey: ['instruments'],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { id: string; name: string }[] }>('/instruments');
      return res.data.data;
    },
  });

  // Load existing instruments
  const { data: existingInstruments } = useQuery({
    queryKey: [entityType === 'student' ? 'students' : 'teachers', entityId, 'instruments'],
    queryFn: () =>
      entityType === 'student'
        ? studentsApi.getStudentInstruments(entityId)
        : teachersApi.getTeacherInstruments(entityId),
  });

  useEffect(() => {
    if (existingInstruments) {
      setItems(existingInstruments as (StudentInstrument | TeacherInstrument)[]);
    }
  }, [existingInstruments]);

  const updateMutation = useMutation({
    mutationFn: (instruments: (StudentInstrumentInput | TeacherInstrumentInput)[]) => {
      if (entityType === 'student') {
        return studentsApi.updateStudentInstruments(entityId, instruments as StudentInstrumentInput[]);
      }
      return teachersApi.updateTeacherInstruments(entityId, instruments as TeacherInstrumentInput[]);
    },
    onSuccess: (data) => {
      setItems(data as (StudentInstrument | TeacherInstrument)[]);
      toast.success('Instruments saved');
      queryClient.invalidateQueries({
        queryKey: [entityType === 'student' ? 'students' : 'teachers', entityId],
      });
    },
    onError: () => toast.error('Error', 'Could not save instruments.'),
  });

  const instrumentOptions = (allInstruments || [])
    .filter((i) => !items.some((it) => it.instrumentId === i.id))
    .map((i) => ({ value: i.id, label: i.name }));

  const handleAdd = () => {
    if (!newInstrumentId) return;
    const newItem = {
      id: `temp-${Date.now()}`,
      instrumentId: newInstrumentId,
      level: newLevel,
      ...(entityType === 'student'
        ? { studentId: entityId }
        : { teacherId: entityId }),
      instrument: allInstruments?.find((i) => i.id === newInstrumentId),
    } as StudentInstrument | TeacherInstrument;

    setItems((prev) => [...prev, newItem]);
    setNewInstrumentId('');
    setNewLevel(InstrumentLevel.BEGINNER);
  };

  const handleRemove = (instrumentId: string) => {
    setItems((prev) => prev.filter((i) => i.instrumentId !== instrumentId));
  };

  const handleLevelChange = (instrumentId: string, level: InstrumentLevel) => {
    setItems((prev) =>
      prev.map((i) => (i.instrumentId === instrumentId ? { ...i, level } : i))
    );
  };

  const handleSave = () => {
    const payload = items.map((i) => ({
      instrumentId: i.instrumentId,
      level: i.level,
    }));
    updateMutation.mutate(payload);
  };

  return (
    <div className="space-y-4">
      {/* Current instruments */}
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.instrumentId}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Music className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {item.instrument?.name || 'Unknown'}
                </span>
              </div>
              <Select
                options={levelOptions}
                value={item.level}
                onValueChange={(v) => handleLevelChange(item.instrumentId, v as InstrumentLevel)}
                containerClassName="w-36"
              />
              <button
                onClick={() => handleRemove(item.instrumentId)}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
          No instruments added yet.
        </p>
      )}

      {/* Add new instrument */}
      {instrumentOptions.length > 0 && (
        <div className="flex items-end gap-3 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-dashed border-primary-200 dark:border-primary-800">
          <Select
            label="Instrument"
            placeholder="Select instrument..."
            options={instrumentOptions}
            value={newInstrumentId}
            onValueChange={setNewInstrumentId}
            containerClassName="flex-1"
          />
          <Select
            label="Level"
            options={levelOptions}
            value={newLevel}
            onValueChange={(v) => setNewLevel(v as InstrumentLevel)}
            containerClassName="w-36"
          />
          <Button
            variant="outline"
            size="md"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={handleAdd}
            disabled={!newInstrumentId}
          >
            Add
          </Button>
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          onClick={handleSave}
          isLoading={updateMutation.isPending}
        >
          Save Instruments
        </Button>
      </div>
    </div>
  );
};

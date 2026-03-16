import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Edit2, Trash2, UserPlus, Mail, Phone, MapPin, Pencil, Building2 } from 'lucide-react';
import { familiesApi, AddFamilyMemberData, UpdateFamilyMemberData } from '@/api/families';
import { usersApi } from '@/api/users';
import { FamilyRelation } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Dialog } from '@/components/ui/Dialog';
import { Avatar } from '@/components/ui/Avatar';
import { FamilyForm } from '@/components/families/FamilyForm';
import { useToast } from '@/components/ui/Toast';
import { useSetBreadcrumb } from '@/components/layout/BreadcrumbContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DialogFooter } from '@/components/ui/Dialog';

const relationOptions = Object.values(FamilyRelation).map((r) => ({
  value: r,
  label: r.charAt(0) + r.slice(1).toLowerCase(),
}));

const addMemberSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  relation: z.nativeEnum(FamilyRelation).optional(),
  isPrimary: z.boolean().optional(),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

const AddMemberForm: React.FC<{
  familyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ familyId, onSuccess, onCancel }) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { relation: FamilyRelation.PARENT, isPrimary: false },
  });

  const watchedRelation = watch('relation');
  const watchedIsPrimary = watch('isPrimary');

  const mutation = useMutation({
    mutationFn: (data: AddFamilyMemberData) => familiesApi.addMember(familyId, data),
    onSuccess: () => {
      toast.success('Member added');
      queryClient.invalidateQueries({ queryKey: ['families', familyId] });
      onSuccess();
    },
    onError: () => toast.error('Error', 'Could not add member. Check the user ID.'),
  });

  const onSubmit = (data: AddMemberFormData) => {
    mutation.mutate({
      userId: data.userId,
      relation: data.relation,
      isPrimary: data.isPrimary,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="User ID"
        placeholder="Paste user ID here"
        {...register('userId')}
        error={errors.userId?.message}
        required
        helperText="The UUID of the user account to add as a family member"
      />

      <Select
        label="Relation"
        options={relationOptions}
        value={watchedRelation || FamilyRelation.PARENT}
        onValueChange={(v) => setValue('relation', v as FamilyRelation)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={watchedIsPrimary}
          onClick={() => setValue('isPrimary', !watchedIsPrimary)}
          className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            watchedIsPrimary ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              watchedIsPrimary ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm text-gray-700 dark:text-gray-300">Primary contact</label>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={mutation.isPending}>
          Add Member
        </Button>
      </DialogFooter>
    </form>
  );
};

const editMemberSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  relation: z.nativeEnum(FamilyRelation).optional(),
  isPrimary: z.boolean().optional(),
});

type EditMemberFormData = z.infer<typeof editMemberSchema>;

const EditMemberForm: React.FC<{
  member: import('@/types').FamilyMember;
  familyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ member, familyId, onSuccess, onCancel }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const profile = member.user?.profile;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<EditMemberFormData>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      postalCode: profile?.postalCode || '',
      relation: member.relation,
      isPrimary: member.isPrimary,
    },
  });

  const watchedRelation = watch('relation');
  const watchedIsPrimary = watch('isPrimary');

  const profileMutation = useMutation({
    mutationFn: (data: EditMemberFormData) => usersApi.updateUserProfile(member.userId, {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode,
    }),
    onError: () => { throw new Error('profile'); },
  });

  const memberMutation = useMutation({
    mutationFn: (data: UpdateFamilyMemberData) => familiesApi.updateMember(familyId, member.userId, data),
    onError: () => { throw new Error('member'); },
  });

  const onSubmit = async (data: EditMemberFormData) => {
    try {
      await profileMutation.mutateAsync(data);
      await memberMutation.mutateAsync({ relation: data.relation, isPrimary: data.isPrimary });
      toast.success('Member updated');
      queryClient.invalidateQueries({ queryKey: ['families', familyId] });
      onSuccess();
    } catch {
      toast.error('Error', 'Could not update member.');
    }
  };

  const isPending = profileMutation.isPending || memberMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="First Name" {...register('firstName')} error={errors.firstName?.message} required />
        <Input label="Last Name" {...register('lastName')} error={errors.lastName?.message} required />
      </div>
      <Input label="Phone" {...register('phone')} />
      <Input label="Address" {...register('address')} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="City" {...register('city')} />
        <Input label="Postal Code" {...register('postalCode')} />
      </div>

      <Select
        label="Relation"
        options={relationOptions}
        value={watchedRelation || FamilyRelation.OTHER}
        onValueChange={(v) => setValue('relation', v as FamilyRelation)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={watchedIsPrimary}
          onClick={() => setValue('isPrimary', !watchedIsPrimary)}
          className={`relative inline-flex h-5 w-9 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 ${
            watchedIsPrimary ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              watchedIsPrimary ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <label className="text-sm text-gray-700 dark:text-gray-300">Primary contact</label>
      </div>

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" isLoading={isPending}>Save</Button>
      </DialogFooter>
    </form>
  );
};

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editingMember, setEditingMember] = useState<import('@/types').FamilyMember | null>(null);

  const { data: family, isLoading } = useQuery({
    queryKey: ['families', id],
    queryFn: () => familiesApi.getFamily(id!),
    enabled: !!id,
  });

  useSetBreadcrumb(id, family?.name);

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => familiesApi.removeMember(id!, userId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['families', id] });
    },
    onError: () => toast.error('Error', 'Could not remove member.'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Family not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/families')}>
          Back to Families
        </Button>
      </div>
    );
  }

  const students = family.students || [];
  const members = family.members || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate('/families')}
        >
          Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
            {family.name}
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Edit2 className="h-4 w-4" />}
          onClick={() => setShowEdit(true)}
        >
          Edit
        </Button>
      </div>

      {/* Billing Address */}
      {(family.billingAddress || family.billingCity || family.billingPostal) && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-start gap-3">
          <Building2 className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Billing Address</p>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {[family.billingAddress, family.billingPostal, family.billingCity].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Students
                {students.length > 0 && (
                  <Badge variant="info" size="sm" className="ml-2">
                    {students.length}
                  </Badge>
                )}
              </h2>
            </div>
          </Card.Header>
          <Card.Body>
            {!students.length ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No students in this family yet.
              </p>
            ) : (
              <div className="space-y-3">
                {students.map((student) => {
                  const profile = student.user?.profile;
                  const name = profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : student.user?.email || '—';
                  const activeEnrollments =
                    student.enrollments?.filter((e) => e.status === 'ACTIVE') || [];
                  return (
                    <Link
                      key={student.id}
                      to={`/students/${student.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Avatar name={name} src={profile?.avatarUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activeEnrollments.length > 0
                            ? `${activeEnrollments.length} active course${activeEnrollments.length > 1 ? 's' : ''}`
                            : 'No active courses'}
                        </p>
                      </div>
                      <Badge
                        variant={student.user?.isActive ? 'success' : 'gray'}
                        size="sm"
                        dot
                      >
                        {student.user?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Members (parents/guardians) */}
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Members
                {members.length > 0 && (
                  <Badge variant="info" size="sm" className="ml-2">
                    {members.length}
                  </Badge>
                )}
              </h2>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                onClick={() => setShowAddMember(true)}
              >
                Add
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {!members.length ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No members yet. Add parents or guardians.
              </p>
            ) : (
              <div className="space-y-3">
                {members.map((member) => {
                  const profile = member.user?.profile;
                  const name = profile
                    ? `${profile.firstName} ${profile.lastName}`
                    : member.user?.email || '—';
                  return (
                    <div
                      key={member.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
                    >
                      <Avatar name={name} size="sm" className="mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {name}
                          </p>
                          <Badge variant="gray" size="sm" className="capitalize">
                            {member.relation.toLowerCase()}
                          </Badge>
                          {member.isPrimary && (
                            <Badge variant="purple" size="sm">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          {member.user?.email && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <a
                                href={`mailto:${member.user.email}`}
                                className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {member.user.email}
                              </a>
                            </div>
                          )}
                          {profile?.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Phone className="h-3 w-3 flex-shrink-0" />
                              <a href={`tel:${profile.phone}`} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors" onClick={(e) => e.stopPropagation()}>
                                {profile.phone}
                              </a>
                            </div>
                          )}
                          {(profile?.address || profile?.city) && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span>{[profile.address, profile.postalCode, profile.city].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMember(member)}
                        className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberMutation.mutate(member.userId)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>
      </div>

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit} title="Edit Family" size="md">
        <FamilyForm
          family={family}
          onSuccess={() => setShowEdit(false)}
          onCancel={() => setShowEdit(false)}
        />
      </Dialog>

      {/* Add member dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember} title="Add Family Member" size="sm">
        <AddMemberForm
          familyId={id!}
          onSuccess={() => setShowAddMember(false)}
          onCancel={() => setShowAddMember(false)}
        />
      </Dialog>

      {/* Edit member dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)} title="Edit Member" size="md">
        {editingMember && (
          <EditMemberForm
            member={editingMember}
            familyId={id!}
            onSuccess={() => setEditingMember(null)}
            onCancel={() => setEditingMember(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

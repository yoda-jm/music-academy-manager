import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock } from 'lucide-react';
import { usersApi, UpdateProfileData, ChangePasswordData } from '@/api/users';
import { useAuthStore } from '@/store/auth.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { DatePicker } from '@/components/ui/DatePicker';
import { Tabs, TabContent } from '@/components/ui/Tabs';
import { RoleBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFD = z.infer<typeof profileSchema>;
type PasswordFD = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();
  const queryClient = useQueryClient();

  const profile = user?.profile;
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : user?.email || '';

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    setValue: setProfileValue,
    watch: watchProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFD>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      dateOfBirth: profile?.dateOfBirth?.split('T')[0] || '',
      address: profile?.address || '',
      city: profile?.city || '',
      postalCode: profile?.postalCode || '',
      country: profile?.country || '',
    },
  });

  const {
    register: registerPwd,
    handleSubmit: handlePwdSubmit,
    reset: resetPwd,
    formState: { errors: pwdErrors },
  } = useForm<PasswordFD>({ resolver: zodResolver(passwordSchema) });

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileData) => usersApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      toast.success('Profile updated');
      if (user) {
        updateUser({ ...user, profile: updatedProfile });
      }
    },
    onError: () => toast.error('Error', 'Could not update profile.'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) => usersApi.changePassword(data),
    onSuccess: () => {
      toast.success('Password changed', 'Your password has been updated successfully.');
      resetPwd();
    },
    onError: () => toast.error('Error', 'Current password is incorrect.'),
  });

  const watchedDOB = watchProfile('dateOfBirth');

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile summary */}
      <Card className="mb-6">
        <Card.Body>
          <div className="flex items-center gap-5">
            <Avatar src={profile?.avatarUrl} name={displayName} size="xl" />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
              <div className="mt-2">
                {user?.role && <RoleBadge role={user.role} />}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Tabs
        tabs={[
          { value: 'profile', label: 'Personal Info', icon: <User className="h-4 w-4" /> },
          { value: 'security', label: 'Security', icon: <Lock className="h-4 w-4" /> },
        ]}
      >
        <TabContent value="profile">
          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Personal Information</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleProfileSubmit((d) => profileMutation.mutate(d))} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" {...registerProfile('firstName')} error={profileErrors.firstName?.message} required />
                  <Input label="Last Name" {...registerProfile('lastName')} error={profileErrors.lastName?.message} required />
                </div>
                <Input label="Phone" type="tel" {...registerProfile('phone')} error={profileErrors.phone?.message} />
                <DatePicker
                  label="Date of Birth"
                  value={watchedDOB}
                  onChange={(v) => setProfileValue('dateOfBirth', v)}
                  error={profileErrors.dateOfBirth?.message}
                />
                <Input label="Address" {...registerProfile('address')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" {...registerProfile('city')} />
                  <Input label="Postal Code" {...registerProfile('postalCode')} />
                </div>
                <Input label="Country" {...registerProfile('country')} />
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" isLoading={profileMutation.isPending}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </TabContent>

        <TabContent value="security">
          <Card>
            <Card.Header>
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handlePwdSubmit((d) => passwordMutation.mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword }))} className="space-y-4">
                <Input
                  label="Current Password"
                  type="password"
                  {...registerPwd('currentPassword')}
                  error={pwdErrors.currentPassword?.message}
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  {...registerPwd('newPassword')}
                  error={pwdErrors.newPassword?.message}
                  helperText="At least 8 characters"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  {...registerPwd('confirmPassword')}
                  error={pwdErrors.confirmPassword?.message}
                  required
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="primary" isLoading={passwordMutation.isPending}>
                    Change Password
                  </Button>
                </div>
              </form>
            </Card.Body>
          </Card>
        </TabContent>
      </Tabs>
    </div>
  );
}

/**
 * Security page — password change + session info.
 */
'use client';

import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useChangePassword, useProfile } from '@/hooks/player-hooks';
import { ApiRequestError } from '@/lib/api';
import { PageContainer, LoadingState } from '@/components/shared';
import PlayerPageHeader from '@/components/player/PlayerPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/card-badge-label';

export default function SecurityPage() {
  const { data: profile } = useProfile();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError('Password must be ≥8 chars with at least one letter and one number.');
      return;
    }

    try {
      await changePassword.mutateAsync({ currentPassword, newPassword, confirmPassword });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Password change failed.');
    }
  };

  if (!profile) return <LoadingState />;

  return (
    <PageContainer>
      <PlayerPageHeader title="Security" subtitle="Manage your password and account status" icon={ShieldCheck} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="current">Current Password</Label>
                <Input
                  id="current"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new">New Password</Label>
                <Input
                  id="new"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirm New Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                  Password changed successfully.
                </div>
              )}

              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending ? 'Updating…' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Account Status</span>
              <Badge variant="success">ACTIVE</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">KYC Verification</span>
              <Badge variant={profile.kycStatus === 'APPROVED' ? 'success' : 'warning'}>
                {profile.kycStatus}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Member Since</span>
              <span className="text-sm">
                {new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
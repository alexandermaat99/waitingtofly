'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AddAdminForm } from './add-admin-form';

interface Admin {
  id: string;
  email: string;
  role: string;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export function AdminManagement() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/admins');
      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }
      const data = await response.json();
      setAdmins(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (adminId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: adminId, 
          is_active: !currentStatus 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update admin status');
      }

      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (!confirm(`Are you sure you want to delete admin ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/admins?id=${adminId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete admin');
      }

      await fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete admin');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading admins...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <Button onClick={fetchAdmins} className="mt-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Management</h2>
        <Button onClick={() => setShowAddForm(true)}>
          Add New Admin
        </Button>
      </div>

      <div className="grid gap-4">
        {admins.map((admin) => (
          <Card key={admin.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold">{admin.email}</h3>
                  <Badge variant={admin.is_super_admin ? 'default' : 'secondary'}>
                    {admin.is_super_admin ? 'Super Admin' : 'Admin'}
                  </Badge>
                  <Badge variant={admin.is_active ? 'default' : 'secondary'}>
                    {admin.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  Created: {new Date(admin.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant={admin.is_active ? 'outline' : 'default'}
                  onClick={() => handleToggleActive(admin.id, admin.is_active)}
                >
                  {admin.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                {!admin.is_super_admin && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {admins.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No admins found.
        </div>
      )}

      {showAddForm && (
        <AddAdminForm
          onSuccess={() => {
            setShowAddForm(false);
            fetchAdmins();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      )}
    </div>
  );
}

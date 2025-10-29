'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface MailingListSubscriber {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  source: string;
  status: string;
  subscribed_at: string;
  unsubscribed_at: string | null;
  last_email_sent: string | null;
  email_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function MailingListManagement() {
  const [subscribers, setSubscribers] = useState<MailingListSubscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    search: ''
  });
  const [editingSubscriber, setEditingSubscriber] = useState<MailingListSubscriber | null>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    first_name: '',
    last_name: ''
  });
  const [copySuccess, setCopySuccess] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'unsubscribed', label: 'Unsubscribed' },
    { value: 'bounced', label: 'Bounced' },
    { value: 'complained', label: 'Complained' }
  ];

  const sourceOptions = [
    { value: 'all', label: 'All Sources' },
    { value: 'website', label: 'Website' },
    { value: 'preorder', label: 'Preorder' },
    { value: 'order', label: 'Order' },
    { value: 'manual', label: 'Manual' }
  ];

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/mailing-list?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscribers');
      }

      const data = await response.json();
      setSubscribers(data.data || []);
      setPagination(data.pagination || pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleEdit = (subscriber: MailingListSubscriber) => {
    setEditingSubscriber(subscriber);
    setEditForm({
      status: subscriber.status,
      notes: subscriber.notes || '',
      first_name: subscriber.first_name || '',
      last_name: subscriber.last_name || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSubscriber) return;

    try {
      const response = await fetch('/api/admin/mailing-list', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingSubscriber.id,
          ...editForm
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update subscriber');
      }

      await fetchSubscribers();
      setEditingSubscriber(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update subscriber');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this subscriber? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/mailing-list?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subscriber');
      }

      await fetchSubscribers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete subscriber');
    }
  };

  const handleCopyAllEmails = async () => {
    try {
      // Get all active subscribers from current view (respects filters)
      const activeSubscribers = subscribers.filter(sub => sub.status === 'active');
      const emails = activeSubscribers.map(sub => sub.email);
      
      if (emails.length === 0) {
        alert('No active subscribers found to copy.');
        return;
      }

      // Join emails with semicolon and space for email clients
      const emailString = emails.join('; ');
      
      // Copy to clipboard
      await navigator.clipboard.writeText(emailString);
      setCopySuccess(true);
      
      // Reset success message after 3 seconds
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error('Failed to copy emails:', err);
      alert('Failed to copy emails to clipboard. Please try again.');
    }
  };

  const getActiveEmailCount = () => {
    return subscribers.filter(sub => sub.status === 'active').length;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'unsubscribed':
        return 'secondary';
      case 'bounced':
        return 'destructive';
      case 'complained':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getSourceBadgeVariant = (source: string) => {
    switch (source) {
      case 'website':
        return 'default';
      case 'preorder':
        return 'secondary';
      case 'order':
        return 'outline';
      case 'manual':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading mailing list...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <Button onClick={fetchSubscribers} className="mt-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Mailing List Management</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Total: {pagination.total} subscribers
          </div>
          <Button
            onClick={handleCopyAllEmails}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={getActiveEmailCount() === 0}
            title="Copy all active subscriber emails to clipboard (semicolon-separated for email clients)"
          >
            📧 Copy Active Emails ({getActiveEmailCount()})
          </Button>
          {copySuccess && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Copied to clipboard!
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="status-filter">Status:</Label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="source-filter">Source:</Label>
          <select
            id="source-filter"
            value={filters.source}
            onChange={(e) => handleFilterChange('source', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {sourceOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="search">Search:</Label>
          <Input
            id="search"
            placeholder="Email, name..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Subscribers List */}
      <div className="space-y-4">
        {subscribers.map((subscriber) => (
          <Card key={subscriber.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{subscriber.email}</h3>
                  <Badge variant={getStatusBadgeVariant(subscriber.status)}>
                    {subscriber.status}
                  </Badge>
                  <Badge variant={getSourceBadgeVariant(subscriber.source)}>
                    {subscriber.source}
                  </Badge>
                </div>
                
                {(subscriber.first_name || subscriber.last_name) && (
                  <p className="text-gray-600 text-sm mb-1">
                    {[subscriber.first_name, subscriber.last_name].filter(Boolean).join(' ')}
                  </p>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <div>Subscribed: {new Date(subscriber.subscribed_at).toLocaleString()}</div>
                  {subscriber.unsubscribed_at && (
                    <div>Unsubscribed: {new Date(subscriber.unsubscribed_at).toLocaleString()}</div>
                  )}
                  <div>Emails sent: {subscriber.email_count}</div>
                  {subscriber.last_email_sent && (
                    <div>Last email: {new Date(subscriber.last_email_sent).toLocaleString()}</div>
                  )}
                  {subscriber.notes && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                      <strong>Notes:</strong> {subscriber.notes}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(subscriber)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(subscriber.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Next
          </Button>
        </div>
      )}

      {subscribers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No subscribers found matching your criteria.
        </div>
      )}

      {/* Edit Modal */}
      {editingSubscriber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Subscriber</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {statusOptions.filter(opt => opt.value !== 'all').map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingSubscriber(null)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SiteConfigForm } from './site-config-form';
import { AdminManagement } from './admin-management';
import { MailingListManagement } from './mailing-list-management';

interface SiteConfig {
  id: string;
  config_key: string;
  config_value: unknown;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminDashboard() {
  const [configs, setConfigs] = useState<SiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<SiteConfig | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'config' | 'admins' | 'mailing'>('config');
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false);

  const categories = ['all', 'book', 'author', 'testimonials', 'preorder', 'stats', 'site'];

  useEffect(() => {
    fetchConfigs();
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    try {
      const response = await fetch('/api/admin/check-super-admin');
      if (response.ok) {
        const data = await response.json();
        setIsSuperAdminUser(data.is_super_admin || false);
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/site-config');
      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }
      const data = await response.json();
      setConfigs(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const friendlyTitle = (key: string) => {
    const map: Record<string, string> = {
      book_info: 'Book Info',
      book_formats: 'Book Formats & Pricing',
      author_info: 'Author Info',
      testimonials: 'Testimonials',
      preorder_stats: 'Preorder Stats',
      preorder_benefits: 'Preorder Benefits',
      site_config: 'Footer Content',
    };
    if (map[key]) return map[key];
    // Fallback: Title Case and replace underscores
    return key
      .split('_')
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(' ');
  };

  const filteredConfigs = configs.filter(config => {
    const searchLower = searchTerm.toLowerCase();
    
    // Search through key and description
    const keyMatch = config.config_key.toLowerCase().includes(searchLower);
    const descMatch = config.description?.toLowerCase().includes(searchLower);
    
    // Search through the actual content (JSON values)
    const contentMatch = JSON.stringify(config.config_value).toLowerCase().includes(searchLower);
    
    const matchesSearch = keyMatch || descMatch || contentMatch;
    const matchesCategory = selectedCategory === 'all' || config.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeConfigs = filteredConfigs.filter(config => config.is_active);
  const inactiveConfigs = filteredConfigs.filter(config => !config.is_active);

  const handleConfigUpdate = async (key: string, value: unknown, description?: string) => {
    try {
      const response = await fetch('/api/admin/site-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to update configuration');
      }

      // Refresh the configs list
      await fetchConfigs();
      setSelectedConfig(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    }
  };

  const handleConfigDeactivate = async (key: string) => {
    if (!confirm('Are you sure you want to deactivate this configuration?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/site-config?key=${key}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate configuration');
      }

      // Refresh the configs list
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate configuration');
    }
  };

  const handleConfigActivate = async (key: string) => {
    try {
      const response = await fetch('/api/admin/site-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, is_active: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to activate configuration');
      }

      // Refresh the configs list
      await fetchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to activate configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading configurations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <Button onClick={fetchConfigs} className="mt-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <div className="flex gap-2">
          <div className="flex gap-1 mr-4">
            <Button
              variant={activeTab === 'config' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('config')}
            >
              Site Config
            </Button>
            <Button
              variant={activeTab === 'mailing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('mailing')}
            >
              Mailing List
            </Button>
            {isSuperAdminUser && (
              <Button
                variant={activeTab === 'admins' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('admins')}
              >
                Manage Admins
              </Button>
            )}
          </div>
          {activeTab === 'config' && (
            <>
              <Input
                placeholder="Search configurations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {activeTab === 'config' ? (
        <div className="space-y-8">
          {/* Active Configurations */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Configurations</h2>
            <div className="grid gap-4">
              {activeConfigs.map((config) => (
                <Card key={config.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{friendlyTitle(config.config_key)}</h3>
                        <Badge variant="default">Active</Badge>
                        <Badge variant="outline">{friendlyTitle(config.category)}</Badge>
                      </div>
                      {config.description && (
                        <p className="text-gray-600 text-sm mb-2">{config.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Updated: {new Date(config.updated_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedConfig(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleConfigDeactivate(config.config_key)}
                      >
                        Deactivate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Inactive Configurations */}
          {inactiveConfigs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Deactivated Configurations</h2>
              <div className="grid gap-4">
                {inactiveConfigs.map((config) => (
                  <Card key={config.id} className="p-4 bg-gray-50 border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-600">{friendlyTitle(config.config_key)}</h3>
                          <Badge variant="secondary">Inactive</Badge>
                          <Badge variant="outline">{friendlyTitle(config.category)}</Badge>
                        </div>
                        {config.description && (
                          <p className="text-gray-500 text-sm mb-2">{config.description}</p>
                        )}
                        <div className="text-xs text-gray-400">
                          Updated: {new Date(config.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedConfig(config)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleConfigActivate(config.config_key)}
                        >
                          Reactivate
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'admins' ? (
        <AdminManagement />
      ) : (
        <MailingListManagement />
      )}

      {activeTab === 'config' && filteredConfigs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No configurations found matching your criteria.
        </div>
      )}

      {selectedConfig && (
        <SiteConfigForm
          config={selectedConfig}
          onSave={handleConfigUpdate}
          onCancel={() => setSelectedConfig(null)}
        />
      )}
    </div>
  );
}

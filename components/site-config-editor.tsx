'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface SiteConfig {
  id: string;
  config_key: string;
  config_value: any;
  description: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SiteConfigEditorProps {
  config: SiteConfig;
  onSave: (key: string, value: any, description?: string) => Promise<void>;
  onCancel: () => void;
}

export function SiteConfigEditor({ config, onSave, onCancel }: SiteConfigEditorProps) {
  const [value, setValue] = useState(JSON.stringify(config.config_value, null, 2));
  const [description, setDescription] = useState(config.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      
      // Validate JSON
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
      } catch (err) {
        setError('Invalid JSON format. Please check your syntax.');
        return;
      }

      await onSave(config.config_key, parsedValue, description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      setValue(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err) {
      setError('Invalid JSON format. Cannot format.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Edit Configuration</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{config.category}</Badge>
                <span className="text-sm text-gray-500">{config.config_key}</span>
              </div>
            </div>
            <Button variant="ghost" onClick={onCancel}>
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this configuration..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="value">Configuration Value (JSON)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleFormat}
              >
                Format JSON
              </Button>
            </div>
            <textarea
              id="value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full h-64 p-3 border border-gray-300 rounded-md font-mono text-sm"
              placeholder="Enter JSON configuration..."
            />
            {error && (
              <div className="text-red-600 text-sm mt-1">{error}</div>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-medium mb-2">Configuration Preview:</h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(JSON.parse(value || '{}'), null, 2)}
            </pre>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

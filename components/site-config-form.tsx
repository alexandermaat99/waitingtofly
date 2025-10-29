'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

interface SiteConfigFormProps {
  config: SiteConfig;
  onSave: (key: string, value: any, description?: string) => Promise<void>;
  onCancel: () => void;
}

export function SiteConfigForm({ config, onSave, onCancel }: SiteConfigFormProps) {
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(config.config_value || {});
  }, [config]);

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      await onSave(config.config_key, formData, config.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const renderFormFields = () => {
    switch (config.config_key) {
      case 'book_info':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Book Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter book title"
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author || ''}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                placeholder="Enter author name"
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={formData.genre || ''}
                onChange={(e) => setFormData({...formData, genre: e.target.value})}
                placeholder="e.g., Memoir • Biography • History"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter book description"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                id="releaseDate"
                value={formData.releaseDate || ''}
                onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                placeholder="e.g., December 2025"
              />
            </div>
            <div>
              <Label htmlFor="preorderBonus">Preorder Bonus</Label>
              <Input
                id="preorderBonus"
                value={formData.preorderBonus || ''}
                onChange={(e) => setFormData({...formData, preorderBonus: e.target.value})}
                placeholder="e.g., Preorder now and get a signed copy!"
              />
            </div>
          </div>
        );

      case 'author_info':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Author Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter author name"
              />
            </div>
            <div>
              <Label htmlFor="bio">Biography</Label>
              <Textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Enter author biography"
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="personalNote">Personal Note</Label>
              <Textarea
                id="personalNote"
                value={formData.personalNote || ''}
                onChange={(e) => setFormData({...formData, personalNote: e.target.value})}
                placeholder="Enter personal note"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="quote">Quote</Label>
              <Textarea
                id="quote"
                value={formData.quote || ''}
                onChange={(e) => setFormData({...formData, quote: e.target.value})}
                placeholder="Enter author quote"
                rows={2}
              />
            </div>
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            {Array.isArray(formData) && formData.map((testimonial: any, index: number) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div>
                    <Label>Quote {index + 1}</Label>
                    <Textarea
                      value={testimonial.quote || ''}
                      onChange={(e) => {
                        const currentData = Array.isArray(formData) ? formData : [];
                        const newData = [...currentData];
                        newData[index] = {...testimonial, quote: e.target.value};
                        setFormData(newData);
                      }}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Author</Label>
                      <Input
                        value={testimonial.author || ''}
                        onChange={(e) => {
                          const currentData = Array.isArray(formData) ? formData : [];
                          const newData = [...currentData];
                          newData[index] = {...testimonial, author: e.target.value};
                          setFormData(newData);
                        }}
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input
                        value={testimonial.role || ''}
                        onChange={(e) => {
                          const currentData = Array.isArray(formData) ? formData : [];
                          const newData = [...currentData];
                          newData[index] = {...testimonial, role: e.target.value};
                          setFormData(newData);
                        }}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove this testimonial? This action cannot be undone.`)) {
                        const currentData = Array.isArray(formData) ? formData : [];
                        const newData = currentData.filter((_: any, i: number) => i !== index);
                        setFormData(newData);
                      }
                    }}
                  >
                    Remove Testimonial
                  </Button>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentData = Array.isArray(formData) ? formData : [];
                setFormData([...currentData, { quote: '', author: '', role: '' }]);
              }}
            >
              Add Testimonial
            </Button>
          </div>
        );

      case 'preorder_benefits':
        return (
          <div className="space-y-4">
            {Array.isArray(formData) && formData.map((benefit: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={benefit}
                  onChange={(e) => {
                    const currentData = Array.isArray(formData) ? formData : [];
                    const newData = [...currentData];
                    newData[index] = e.target.value;
                    setFormData(newData);
                  }}
                  placeholder="Enter benefit"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`Are you sure you want to remove this preorder benefit? This action cannot be undone.`)) {
                      const currentData = Array.isArray(formData) ? formData : [];
                      const newData = currentData.filter((_: any, i: number) => i !== index);
                      setFormData(newData);
                    }
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const currentData = Array.isArray(formData) ? formData : [];
                setFormData([...currentData, '']);
              }}
            >
              Add Benefit
            </Button>
          </div>
        );

      case 'book_formats':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Book Format Pricing</h3>
            {Object.entries(formData).map(([formatKey, formatData]: [string, any]) => (
              <Card key={formatKey} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-700">{formatKey.charAt(0).toUpperCase() + formatKey.slice(1)}</Label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove the "${formatData.name || formatKey}" format? This action cannot be undone.`)) {
                          const newData = { ...formData };
                          delete newData[formatKey];
                          setFormData(newData);
                        }
                      }}
                    >
                      Remove Format
                    </Button>
                  </div>
                  <div>
                    <Label>Format Name</Label>
                    <Input
                      value={formatData.name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [formatKey]: {...formatData, name: e.target.value}
                      })}
                      placeholder="e.g., Hardcover"
                    />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formatData.price || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [formatKey]: {...formatData, price: parseFloat(e.target.value) || 0}
                      })}
                      placeholder="24.99"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formatData.description || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [formatKey]: {...formatData, description: e.target.value}
                      })}
                      placeholder="e.g., Premium hardcover edition with dust jacket"
                      rows={2}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const newKey = `format_${Date.now()}`;
                setFormData({
                  ...formData,
                  [newKey]: {
                    name: '',
                    price: 0,
                    description: ''
                  }
                });
              }}
            >
              Add New Format
            </Button>
          </div>
        );


      case 'preorder_stats':
        return (
          <div className="space-y-4">
            <h3 className="font-medium">Preorder Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Early Preorders</Label>
                <Input
                  value={formData.earlyPreorders || ''}
                  onChange={(e) => setFormData({...formData, earlyPreorders: e.target.value})}
                  placeholder="500+"
                />
              </div>
              <div>
                <Label>Rating</Label>
                <Input
                  value={formData.rating || ''}
                  onChange={(e) => setFormData({...formData, rating: e.target.value})}
                  placeholder="4.9/5"
                />
              </div>
              <div>
                <Label>Countries</Label>
                <Input
                  value={formData.countries || ''}
                  onChange={(e) => setFormData({...formData, countries: e.target.value})}
                  placeholder="50+"
                />
              </div>
            </div>
          </div>
        );

      case 'site_config':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Site Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter site name"
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Textarea
                id="tagline"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({...formData, tagline: e.target.value})}
                placeholder="Enter site tagline"
                rows={3}
              />
            </div>
            <div>
              <Label>Social Links</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={formData.socialLinks?.instagram || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socialLinks: {...formData.socialLinks, instagram: e.target.value}
                    })}
                    placeholder="Instagram URL"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input
                    id="facebook"
                    value={formData.socialLinks?.facebook || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socialLinks: {...formData.socialLinks, facebook: e.target.value}
                    })}
                    placeholder="Facebook URL"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={formData.socialLinks?.linkedin || ''}
                    onChange={(e) => setFormData({
                      ...formData, 
                      socialLinks: {...formData.socialLinks, linkedin: e.target.value}
                    })}
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div>
              <Label>Configuration Value (JSON)</Label>
              <Textarea
                value={JSON.stringify(formData, null, 2)}
                onChange={(e) => {
                  try {
                    setFormData(JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, keep the text
                  }
                }}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500 mt-1">
                Edit the JSON directly for this configuration type
              </p>
            </div>
          </div>
        );
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
          {renderFormFields()}
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
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

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
  const [formatsInput, setFormatsInput] = useState<string>('');

  // Helper function to convert object with numeric keys to array
  const objectToArray = (obj: any): any[] => {
    if (Array.isArray(obj)) {
      return obj;
    }
    if (obj && typeof obj === 'object') {
      // Check if it's an object with numeric string keys (like {"0": {...}, "1": {...}})
      const keys = Object.keys(obj);
      const allNumericKeys = keys.every(key => /^\d+$/.test(key));
      if (allNumericKeys && keys.length > 0) {
        // Convert to array by sorting keys numerically and mapping
        return keys
          .map(Number)
          .sort((a, b) => a - b)
          .map(key => obj[String(key)]);
      }
    }
    return [];
  };

  useEffect(() => {
    // Handle shipping_price which is a number, not an object
    if (config.config_key === 'shipping_price') {
      setFormData(config.config_value || 0);
    } else if (config.config_key === 'testimonials' || config.config_key === 'preorder_benefits') {
      // Ensure these are always arrays, converting from object if needed
      const value = config.config_value;
      if (Array.isArray(value)) {
        setFormData(value);
      } else {
        // Try to convert object to array
        const converted = objectToArray(value);
        setFormData(converted.length > 0 ? converted : []);
      }
    } else {
      setFormData(config.config_value || {});
      // Initialize formats input string
      if (config.config_key === 'book_info') {
        const formats = (config.config_value || {}).formats;
        if (Array.isArray(formats)) {
          setFormatsInput(formats.join(', '));
        } else {
          setFormatsInput('');
        }
      }
    }
  }, [config]);

  const handleSave = async () => {
    try {
      setError(null);
      setSaving(true);
      
      let dataToSave: any;
      
      // Handle array types (testimonials, preorder_benefits)
      if (config.config_key === 'testimonials' || config.config_key === 'preorder_benefits') {
        dataToSave = Array.isArray(formData) ? formData : [];
      } else if (config.config_key === 'book_info') {
        // Process formats string to array before saving
        dataToSave = { ...formData };
        if (formatsInput) {
          const formatsArray = formatsInput.split(',').map((f: string) => f.trim()).filter((f: string) => f !== '');
          dataToSave.formats = formatsArray;
        }
      } else {
        dataToSave = formData;
      }
      
      await onSave(config.config_key, dataToSave, config.description);
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
            <div>
              <Label htmlFor="series">Series</Label>
              <Input
                id="series"
                value={formData.series || ''}
                onChange={(e) => setFormData({...formData, series: e.target.value})}
                placeholder="e.g., Memoir Series"
              />
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Previous Book Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="previousBook">Previous Book Title</Label>
                  <Input
                    id="previousBook"
                    value={formData.previousBook || ''}
                    onChange={(e) => setFormData({...formData, previousBook: e.target.value})}
                    placeholder="e.g., Before I Became a Refugee Girl: Life in Laos During the Vietnam War Era"
                  />
                </div>
                <div>
                  <Label htmlFor="previousBookUrl">Previous Book URL</Label>
                  <Input
                    id="previousBookUrl"
                    value={formData.previousBookUrl || ''}
                    onChange={(e) => setFormData({...formData, previousBookUrl: e.target.value})}
                    placeholder="https://a.co/d/623YZo9"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Full URL to the previous book (e.g., Amazon link)
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> To edit the previous book year (e.g., 2020), go to <strong>Author Info</strong> configuration and edit the "Previous Works" section.
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="coverImage">Cover Image Path</Label>
                  <Input
                    id="coverImage"
                    value={formData.coverImage || ''}
                    onChange={(e) => setFormData({...formData, coverImage: e.target.value})}
                    placeholder="e.g., /images/bookImage.png"
                  />
                </div>
                <div>
                  <Label htmlFor="formats">Book Formats (comma-separated)</Label>
                  <Input
                    id="formats"
                    value={formatsInput}
                    onChange={(e) => setFormatsInput(e.target.value)}
                    onBlur={() => {
                      // Convert to array when user leaves the field
                      const formatsArray = formatsInput.split(',').map((f: string) => f.trim()).filter((f: string) => f !== '');
                      setFormData({...formData, formats: formatsArray});
                    }}
                    placeholder="e.g., Hardcover, Paperback, eBook"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Type formats separated by commas. You can include commas in format names.
                  </p>
                </div>
              </div>
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
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium mb-3">Previous Works</h3>
              {Array.isArray(formData.previousWorks) && formData.previousWorks.map((work: any, index: number) => (
                <Card key={index} className="p-4 mb-3">
                  <div className="space-y-3">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={work.title || ''}
                        onChange={(e) => {
                          const currentWorks = Array.isArray(formData.previousWorks) ? formData.previousWorks : [];
                          const newWorks = [...currentWorks];
                          newWorks[index] = {...work, title: e.target.value};
                          setFormData({...formData, previousWorks: newWorks});
                        }}
                        placeholder="Book title"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Year</Label>
                        <Input
                          value={work.year || ''}
                          onChange={(e) => {
                            const currentWorks = Array.isArray(formData.previousWorks) ? formData.previousWorks : [];
                            const newWorks = [...currentWorks];
                            newWorks[index] = {...work, year: e.target.value};
                            setFormData({...formData, previousWorks: newWorks});
                          }}
                          placeholder="e.g., 2023"
                        />
                      </div>
                      <div>
                        <Label>Achievement</Label>
                        <Input
                          value={work.achievement || ''}
                          onChange={(e) => {
                            const currentWorks = Array.isArray(formData.previousWorks) ? formData.previousWorks : [];
                            const newWorks = [...currentWorks];
                            newWorks[index] = {...work, achievement: e.target.value};
                            setFormData({...formData, previousWorks: newWorks});
                          }}
                          placeholder="e.g., First Book in Memoir Series"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input
                        value={work.url || ''}
                        onChange={(e) => {
                          const currentWorks = Array.isArray(formData.previousWorks) ? formData.previousWorks : [];
                          const newWorks = [...currentWorks];
                          newWorks[index] = {...work, url: e.target.value};
                          setFormData({...formData, previousWorks: newWorks});
                        }}
                        placeholder="https://a.co/d/623YZo9"
                      />
                    </div>
                  </div>
                </Card>
              ))}
              {(!Array.isArray(formData.previousWorks) || formData.previousWorks.length === 0) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const currentWorks = Array.isArray(formData.previousWorks) ? formData.previousWorks : [];
                    setFormData({
                      ...formData,
                      previousWorks: [...currentWorks, { title: '', year: '', achievement: '', url: '' }]
                    });
                  }}
                >
                  Add Previous Work
                </Button>
              )}
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
            <p className="text-sm text-gray-600 mb-4">
              Format keys should match the format type (e.g., "paperback", "hardcover"). Use lowercase, no spaces.
            </p>
            {Object.entries(formData).map(([formatKey, formatData]: [string, any]) => (
              <Card key={formatKey} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor={`key-${formatKey}`} className="text-sm font-medium text-gray-700">Format Key (Identifier)</Label>
                      <Input
                        key={`input-${formatKey}`}
                        id={`key-${formatKey}`}
                        defaultValue={formatKey}
                        onBlur={(e) => {
                          const newKey = e.target.value.toLowerCase().trim().replace(/\s+/g, '_');
                          if (newKey !== formatKey && newKey !== '') {
                            if (formData[newKey] && newKey !== formatKey) {
                              alert(`Format key "${newKey}" already exists. Please use a different key.`);
                              return;
                            }
                            // Rename the key by creating new object with new key
                            const newData = { ...formData };
                            delete newData[formatKey];
                            newData[newKey] = formatData;
                            setFormData(newData);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.currentTarget.blur();
                          }
                        }}
                        placeholder="e.g., paperback"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the key used in orders. Use: paperback, hardcover, ebook, or audiobook. Press Enter or click away to save.
                      </p>
                    </div>
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
                    <Label>Format Name (Display Name)</Label>
                    <Input
                      value={formatData.name || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        [formatKey]: {...formatData, name: e.target.value}
                      })}
                      placeholder="e.g., Paperback"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This is the name shown to customers
                    </p>
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
                      placeholder="e.g., Premium paperback edition"
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

      case 'shipping_price':
        // Ensure we have a valid number
        const shippingValue = typeof formData === 'number' 
          ? formData 
          : (typeof formData === 'object' && formData !== null ? 0 : (parseFloat(String(formData)) || 0));
        
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="shipping_price">Shipping Price ($)</Label>
              <Input
                id="shipping_price"
                type="number"
                step="0.01"
                min="0"
                value={shippingValue}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(value);
                }}
                placeholder="0.00"
              />
              <p className="text-sm text-gray-500 mt-2">
                Set the shipping price for physical book orders. Enter 0.00 for free shipping.
                Digital products (ebook, audiobook) will always show free shipping regardless of this setting.
              </p>
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Current shipping price:</strong> ${shippingValue.toFixed(2)}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This will be applied to all physical book formats (hardcover, paperback) in the checkout.
                </p>
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

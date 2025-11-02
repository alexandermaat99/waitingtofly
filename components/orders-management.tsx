'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Order {
  id: string;
  email: string;
  name: string;
  book_format: string;
  amount: number;
  payment_intent_id: string;
  status: string;
  book_title: string;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_address_line1: string | null;
  shipping_address_line2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
  shipping_phone: string | null;
  shipping_status: string;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  payment_completed_at: string | null;
  payment_failed_at: string | null;
  updated_at: string;
  subtotal: number | null;
  tax_amount: number | null;
  tax_rate: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
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
    shipping_status: 'all',
    search: ''
  });
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    shipping_status: '',
    tracking_number: ''
  });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [shipOrderId, setShipOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState('');
  const [showShipped, setShowShipped] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' }
  ];

  const shippingStatusOptions = [
    { value: 'all', label: 'All Shipping Statuses' },
    { value: 'not_shipped', label: 'Not Shipped' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'returned', label: 'Returned' }
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters
      });

      const response = await fetch(`/api/admin/orders?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.data || []);
      setPagination(prev => data.pagination || prev);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      shipping_status: order.shipping_status,
      tracking_number: order.tracking_number || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingOrder) return;

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingOrder.id,
          ...editForm
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      await fetchOrders();
      setEditingOrder(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update order');
    }
  };

  const handleQuickShipClick = (order: Order) => {
    setShipOrderId(order.id);
    setTrackingInput(order.tracking_number || '');
  };

  const handleQuickShip = async () => {
    if (!shipOrderId) return;

    try {
      const response = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: shipOrderId,
          shipping_status: 'shipped',
          tracking_number: trackingInput.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark order as shipped');
      }

      await fetchOrders();
      setShipOrderId(null);
      setTrackingInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark order as shipped');
    }
  };


  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'refunded':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getShippingStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'returned':
        return 'destructive';
      case 'not_shipped':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatAddress = (order: Order) => {
    const cityStateZip = [
      order.shipping_city,
      order.shipping_state,
      order.shipping_postal_code
    ].filter(Boolean).join(', ');
    
    const parts = [
      order.shipping_address_line1,
      order.shipping_address_line2,
      cityStateZip,
      order.shipping_country
    ].filter(Boolean);
    return parts.join('\n');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">Error: {error}</div>
        <Button onClick={fetchOrders} className="mt-2" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Orders Management</h2>
        <div className="text-sm text-gray-500">
          Total: {pagination.total} orders
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
          <Label htmlFor="shipping-status-filter">Shipping:</Label>
          <select
            id="shipping-status-filter"
            value={filters.shipping_status}
            onChange={(e) => handleFilterChange('shipping_status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {shippingStatusOptions.map(option => (
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
            placeholder="Email, name, payment ID, tracking..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {/* Unshipped Orders */}
        {orders
          .filter(order => order.shipping_status !== 'shipped' && order.shipping_status !== 'delivered')
          .map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{order.name}</h3>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {order.status}
                    </Badge>
                    <Badge variant={getShippingStatusBadgeVariant(order.shipping_status)}>
                      {order.shipping_status.replace('_', ' ')}
                    </Badge>
                    {order.tracking_number && (
                      <Badge variant="outline">
                        Tracking: {order.tracking_number}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Email:</strong> {order.email}</div>
                    <div><strong>Book Format:</strong> {order.book_format}</div>
                    <div><strong>Amount:</strong> {formatCurrency(order.amount)}</div>
                    {order.subtotal && (
                      <div className="text-xs text-gray-500">
                        Subtotal: {formatCurrency(order.subtotal)} | 
                        Tax: {formatCurrency(order.tax_amount || 0)} 
                        {order.tax_rate && ` (${((order.tax_rate || 0) * 100).toFixed(2)}%)`}
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Created: {new Date(order.created_at).toLocaleString()}
                    </div>
                    {order.payment_completed_at && (
                      <div className="text-xs text-gray-500">
                        Completed: {new Date(order.payment_completed_at).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="mt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                    >
                      {expandedOrder === order.id ? 'Hide' : 'Show'} Details
                    </Button>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm space-y-2">
                      <div>
                        <strong>Payment Intent ID:</strong> {order.payment_intent_id}
                      </div>
                      {(order.shipping_address_line1 || order.shipping_city) && (
                        <div>
                          <strong>Shipping Address:</strong>
                          <pre className="mt-1 whitespace-pre-wrap font-sans">
                            {formatAddress(order)}
                          </pre>
                        </div>
                      )}
                      {order.shipping_phone && (
                        <div>
                          <strong>Phone:</strong> {order.shipping_phone}
                        </div>
                      )}
                      {!order.shipping_address_line1 && !order.shipping_city && (
                        <div className="text-gray-500 italic">No shipping address provided</div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4 flex-col">
                  {order.status === 'completed' && order.shipping_status === 'not_shipped' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleQuickShipClick(order)}
                      className="whitespace-nowrap"
                    >
                      Mark as Shipped
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(order)}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </Card>
          ))}

        {/* Shipped Orders - Collapsible Section */}
        {orders.filter(order => order.shipping_status === 'shipped' || order.shipping_status === 'delivered').length > 0 && (
          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowShipped(!showShipped)}
              className="w-full justify-between mb-2"
            >
              <span className="font-semibold">
                Shipped ({orders.filter(order => order.shipping_status === 'shipped' || order.shipping_status === 'delivered').length})
              </span>
              <span>{showShipped ? '▼' : '▶'}</span>
            </Button>
            
            {showShipped && (
              <div className="space-y-4">
                {orders
                  .filter(order => order.shipping_status === 'shipped' || order.shipping_status === 'delivered')
                  .map((order) => (
                    <Card key={order.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{order.name}</h3>
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status}
                            </Badge>
                            <Badge variant={getShippingStatusBadgeVariant(order.shipping_status)}>
                              {order.shipping_status.replace('_', ' ')}
                            </Badge>
                            {order.tracking_number && (
                              <Badge variant="outline">
                                Tracking: {order.tracking_number}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Email:</strong> {order.email}</div>
                            <div><strong>Book Format:</strong> {order.book_format}</div>
                            <div><strong>Amount:</strong> {formatCurrency(order.amount)}</div>
                            {order.subtotal && (
                              <div className="text-xs text-gray-500">
                                Subtotal: {formatCurrency(order.subtotal)} | 
                                Tax: {formatCurrency(order.tax_amount || 0)} 
                                {order.tax_rate && ` (${((order.tax_rate || 0) * 100).toFixed(2)}%)`}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              Created: {new Date(order.created_at).toLocaleString()}
                            </div>
                            {order.payment_completed_at && (
                              <div className="text-xs text-gray-500">
                                Completed: {new Date(order.payment_completed_at).toLocaleString()}
                              </div>
                            )}
                            {order.shipped_at && (
                              <div className="text-xs text-gray-500">
                                Shipped: {new Date(order.shipped_at).toLocaleString()}
                              </div>
                            )}
                            {order.delivered_at && (
                              <div className="text-xs text-gray-500">
                                Delivered: {new Date(order.delivered_at).toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                              {expandedOrder === order.id ? 'Hide' : 'Show'} Details
                            </Button>
                          </div>

                          {expandedOrder === order.id && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-md text-sm space-y-2">
                              <div>
                                <strong>Payment Intent ID:</strong> {order.payment_intent_id}
                              </div>
                              {(order.shipping_address_line1 || order.shipping_city) && (
                                <div>
                                  <strong>Shipping Address:</strong>
                                  <pre className="mt-1 whitespace-pre-wrap font-sans">
                                    {formatAddress(order)}
                                  </pre>
                                </div>
                              )}
                              {order.shipping_phone && (
                                <div>
                                  <strong>Phone:</strong> {order.shipping_phone}
                                </div>
                              )}
                              {!order.shipping_address_line1 && !order.shipping_city && (
                                <div className="text-gray-500 italic">No shipping address provided</div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-4 flex-col">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(order)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        )}
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

      {orders.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No orders found matching your criteria.
        </div>
      )}

      {/* Ship Order Modal */}
      {shipOrderId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Mark Order as Shipped</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="tracking-number">Tracking Number (optional)</Label>
                <Input
                  id="tracking-number"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  placeholder="Enter tracking number"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleQuickShip();
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleQuickShip} className="flex-1">
                Mark as Shipped
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShipOrderId(null);
                  setTrackingInput('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Order</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-shipping-status">Shipping Status</Label>
                <select
                  id="edit-shipping-status"
                  value={editForm.shipping_status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, shipping_status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  {shippingStatusOptions.filter(opt => opt.value !== 'all').map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="edit-tracking-number">Tracking Number</Label>
                <Input
                  id="edit-tracking-number"
                  value={editForm.tracking_number}
                  onChange={(e) => setEditForm(prev => ({ ...prev, tracking_number: e.target.value }))}
                  placeholder="Enter tracking number"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button onClick={handleSaveEdit} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingOrder(null)}
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


import React, { useState, useEffect } from 'react';
import InputField from '@/components/ReusableComponents/InputField';
import Button from '@/components/ReusableComponents/Button';
import GoodsApis from '@/actions/Apis/GoodsApis';
import { formatCurrency } from '@/utils/order';

// TypeScript interfaces
interface Customer {
  name: string;
  phone: string;
  address: string;
}

interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  unit_price: number;
  quantity: number;
}

interface OrderFormData {
  expected_delivery_date: string;
  order_date: string;
  customer: Customer;
  order_items: OrderItem[];
  total_amount: number;
}

interface FinishedGood {
  _id: string;
  product_name: string;
  description: string;
  unit: string;
  current_stock: number;
  unit_price: number;
}

interface CreateOrderFormProps {
  onSubmit: (data: OrderFormData) => Promise<void>;
  loading?: boolean;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ onSubmit, loading = false }) => {
  const [formData, setFormData] = useState<OrderFormData>({
    expected_delivery_date: '',
    order_date: new Date().toISOString().split('T')[0], // Today's date
    customer: {
      name: '',
      phone: '',
      address: '',
    },
    order_items: [
      {
        productId: '',
        name: '',
        unit: '',
        unit_price: 0,
        quantity: 1,
      }
    ],
    total_amount: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const response = await GoodsApis.getAllGoods();
        if (response.status === 200) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate total amount whenever order items change
  const calculateTotal = (items: OrderItem[]): number => {
    return items.reduce((total, item) => total + (item.unit_price * item.quantity), 0);
  };

  // Update customer data
  const updateCustomer = (field: keyof Customer, value: string): void => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value,
      }
    }));
    
    // Clear error for this field
    if (errors[`customer.${field}`]) {
      setErrors(prev => ({ ...prev, [`customer.${field}`]: '' }));
    }
  };

  // Update order item
  const updateOrderItem = (index: number, field: keyof OrderItem, value: string | number): void => {
    const updatedItems = [...formData.order_items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // If productId is changing, update name, unit, and unit_price
    if (field === 'productId') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        updatedItems[index].name = selectedProduct.product_name;
        updatedItems[index].unit = selectedProduct.unit;
        updatedItems[index].unit_price = selectedProduct.unit_price;
      }
    }

    const newTotal = calculateTotal(updatedItems);
    
    setFormData(prev => ({
      ...prev,
      order_items: updatedItems,
      total_amount: newTotal,
    }));

    // Clear error for this field
    if (errors[`order_items.${index}.${field}`]) {
      setErrors(prev => ({ ...prev, [`order_items.${index}.${field}`]: '' }));
    }
  };

  // Add new order item
  const addOrderItem = (): void => {
    setFormData(prev => ({
      ...prev,
      order_items: [
        ...prev.order_items,
        {
          productId: '',
          name: '',
          unit: '',
          unit_price: 0,
          quantity: 1,
        }
      ]
    }));
  };

  // Remove order item
  const removeOrderItem = (index: number): void => {
    if (formData.order_items.length > 1) {
      const updatedItems = formData.order_items.filter((_, i) => i !== index);
      const newTotal = calculateTotal(updatedItems);
      
      setFormData(prev => ({
        ...prev,
        order_items: updatedItems,
        total_amount: newTotal,
      }));
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Customer validation
    if (!formData.customer.name.trim()) {
      newErrors['customer.name'] = 'Customer name is required';
    }
    if (!formData.customer.phone.trim()) {
      newErrors['customer.phone'] = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.customer.phone.replace(/[^\d]/g, ''))) {
      newErrors['customer.phone'] = 'Please enter a valid phone number';
    }
    if (!formData.customer.address.trim()) {
      newErrors['customer.address'] = 'Address is required';
    }

    // Date validation
    if (!formData.expected_delivery_date) {
      newErrors['expected_delivery_date'] = 'Expected delivery date is required';
    } else if (new Date(formData.expected_delivery_date) <= new Date()) {
      newErrors['expected_delivery_date'] = 'Expected delivery date must be in the future';
    }

    // Order items validation
    formData.order_items.forEach((item, index) => {
      if (!item.productId) {
        newErrors[`order_items.${index}.productId`] = 'Please select a product';
      }
      if (item.quantity <= 0) {
        newErrors[`order_items.${index}.quantity`] = 'Quantity must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      {/* Customer Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            label="Customer Name"
            value={formData.customer.name}
            onChange={(e) => updateCustomer('name', e.target.value)}
            placeholder="Enter customer name"
            required
            error={errors['customer.name']}
          />
          <InputField
            label="Phone Number"
            value={formData.customer.phone}
            onChange={(e) => updateCustomer('phone', e.target.value)}
            placeholder="Enter phone number"
            required
            error={errors['customer.phone']}
            type='number'
          />
        </div>
        <InputField
          label="Address"
          value={formData.customer.address}
          onChange={(e) => updateCustomer('address', e.target.value)}
          placeholder="Enter complete address"
          required
          error={errors['customer.address']}
        />
      </div>

      {/* Order Details */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputField
            label="Order Date"
            type="date"
            value={formData.order_date}
            onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
            required
          />
          <InputField
            label="Expected Delivery Date"
            type="date"
            value={formData.expected_delivery_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
            required
            error={errors['expected_delivery_date']}
          />
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
          <Button
            type="button"
            variant="outline"
            onClick={addOrderItem}
            className="text-sm"
          >
            + Add Item
          </Button>
        </div>

        {loadingProducts ? (
          <div className="flex justify-center items-center p-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {formData.order_items.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-800">Item {index + 1}</h4>
                  {formData.order_items.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => removeOrderItem(index)}
                      className="text-xs px-2 py-1"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Product <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                      className={`w-full px-3 py-2 border ${
                        errors[`order_items.${index}.productId`] ? 'border-red-500' : 'border-gray-300'
                      } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.product_name}
                        </option>
                      ))}
                    </select>
                    {errors[`order_items.${index}.productId`] && (
                      <p className="mt-1 text-sm text-red-600">{errors[`order_items.${index}.productId`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={item.unit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Unit Price
                    </label>
                    <input
                      type="number"
                      value={item.unit_price}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                      disabled
                    />
                  </div>

                  <div>
                    <InputField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      placeholder="1"
                      min="1"
                      required
                      error={errors[`order_items.${index}.quantity`]}
                    />
                  </div>

                  <div className="lg:col-span-4">
                    <div className="text-right">
                      <span className="text-sm text-gray-600">Subtotal: </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="flex justify-between items-center text-xl font-bold text-gray-900">
          <span>Total Amount:</span>
          <span>{formatCurrency(formData.total_amount)}</span>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="min-w-32"
        >
          {loading ? 'Creating...' : 'Create Order'}
        </Button>
      </div>
    </form>
  );
};

export default CreateOrderForm;
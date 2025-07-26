/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from 'react';
import Button from '@/components/ReusableComponents/Button';
import InputField from '@/components/ReusableComponents/InputField';
import CategoryApis from '@/actions/Apis/CategoryApis'; // Import CategoryApis for categories
import DocumentUploadModal from '../modal/DocumentUploadModal';
import { X, CheckCircle } from 'lucide-react'; // Import CheckCircle

// TypeScript interfaces
interface VendorFormData {
  approved_for: string;
  company_name: string;
  company_address: string;
  state: string;
  city: string;
  pincode: string;
  mobile_no: string;
  phone_no: string;
  mail: string;
  website: string;
  company_type: 'Proprietorship' | 'Partnership' | 'Private Limited' | 'Limited' | '';
  partner_name: string;
  contact_person: string;
  contact_designation: string;
  bank_name: string;
  branch_name: string;
  bank_ifsc: string;
  bank_account_no: string;
  bank_micr_code: string;
  bank_swift_code: string;
  gst_no: string;
  pan_no: string;
  is_msme: boolean;
  document_id?: string; // New field for MSME document ID
}

interface VendorFormProps {
  initialData?: Partial<VendorFormData>;
  onSubmit: (data: VendorFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
  title?: string;
}

interface Category {
  _id: string;
  type: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Indian states list
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir'
];

const VendorForm: React.FC<VendorFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Vendor",
  title = "Vendor Registration"
}) => {
  const [formData, setFormData] = useState<VendorFormData>({
    approved_for: '',
    company_name: '',
    company_address: '',
    state: '',
    city: '',
    pincode: '',
    mobile_no: '',
    phone_no: '',
    mail: '',
    website: '',
    company_type: '',
    partner_name: '',
    contact_person: '',
    contact_designation: '',
    bank_name: '',
    branch_name: '',
    bank_ifsc: '',
    bank_account_no: '',
    bank_micr_code: '',
    bank_swift_code: '',
    gst_no: '',
    pan_no: '',
    is_msme: false,
    document_id: undefined, // Initialize as undefined
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // States for MSME document upload modal (passed to DocumentUploadModal)
  const [isMsmeUploadModalOpen, setIsMsmeUploadModalOpen] = useState<boolean>(false);
  const [documentCategories, setDocumentCategories] = useState<string[]>([]); // For MSME document categories
  const [isAddDocumentCategoryModalOpen, setIsAddDocumentCategoryModalOpen] = useState<boolean>(false);
  const [newDocumentCategoryName, setNewDocumentCategoryName] = useState<string>("");
  const [documentCategoryObject, setDocumentCategoryObject] = useState<Category | null>(null);

  // States for "Approved For" categories
  const [approvedForCategories, setApprovedForCategories] = useState<string[]>([]);
  const [isAddApprovedForCategoryModalOpen, setIsAddApprovedForCategoryModalOpen] = useState<boolean>(false);
  const [newApprovedForCategoryName, setNewApprovedForCategoryName] = useState<string>("");
  const [approvedForCategoryObject, setApprovedForCategoryObject] = useState<Category | null>(null);


  // Fetch document categories and Approved-For categories on component mount
  useEffect(() => {
    const fetchCategories = async (): Promise<void> => {
      try {
        const res = await CategoryApis.getAllCategories();
        if (res.status === 200) {
          const docCategory = res.data.find(
            (cat: Category) => cat.type === "Document-Category"
          );
          if (docCategory) {
            setDocumentCategories(docCategory.items);
            setDocumentCategoryObject(docCategory);
          } else {
            setDocumentCategories([]);
            setDocumentCategoryObject(null);
          }

          const approvedForCat = res.data.find(
            (cat: Category) => cat.type === "Approved-For-Category"
          );
          if (approvedForCat) {
            setApprovedForCategories(approvedForCat.items);
            setApprovedForCategoryObject(approvedForCat);
          } else {
            setApprovedForCategories([]);
            setApprovedForCategoryObject(null);
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setDocumentCategories([]);
        setDocumentCategoryObject(null);
        setApprovedForCategories([]);
        setApprovedForCategoryObject(null);
      }
    };
    fetchCategories();
  }, []);


  // Update form data when initial data changes (for edit mode)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Re-validate MSME document field when document_id changes
  useEffect(() => {
    if (formData.is_msme) {
      // Re-run validation specifically for document_id
      const newErrors = { ...errors };
      if (!formData.document_id) {
        newErrors.document_id = 'MSME registration document is required.';
      } else {
        delete newErrors.document_id;
      }
      setErrors(newErrors);
    }
  }, [formData.document_id, formData.is_msme]); // Depend on both for complete check


  const updateFormData = (field: keyof VendorFormData, value: string | boolean | undefined): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Special handling for is_msme to clear document ID if set to false
    if (field === 'is_msme' && value === false) {
        setFormData(prev => ({ ...prev, document_id: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Approved For validation
    if (!formData.approved_for.trim()) {
      newErrors.approved_for = 'Approval category is required';
    }

    // Required field validations
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    
    if (!formData.company_address.trim()) {
      newErrors.company_address = 'Company address is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pin code is required';
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pin code must be 6 digits';
    }

    if (!formData.mobile_no.trim()) {
      newErrors.mobile_no = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile_no.replace(/[^\d]/g, ''))) {
      newErrors.mobile_no = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.mail.trim()) {
      newErrors.mail = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
      newErrors.mail = 'Please enter a valid email address';
    }

    if (!formData.company_type) {
      newErrors.company_type = 'Company type is required';
    }

    if (!formData.contact_person.trim()) {
      newErrors.contact_person = 'Contact person is required';
    }

    if (!formData.contact_designation.trim()) {
      newErrors.contact_designation = 'Contact designation is required';
    }

    // Banking details validations
    if (!formData.bank_name.trim()) { // Now just checks if not empty
      newErrors.bank_name = 'Bank name is required';
    }

    if (!formData.branch_name.trim()) {
      newErrors.branch_name = 'Branch name is required';
    }

    if (!formData.bank_ifsc.trim()) {
      newErrors.bank_ifsc = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_ifsc)) {
      newErrors.bank_ifsc = 'Please enter a valid IFSC code';
    }

    if (!formData.bank_account_no.trim()) {
      newErrors.bank_account_no = 'Bank account number is required';
    }

    // GST and PAN validations
    if (!formData.gst_no.trim()) {
      newErrors.gst_no = 'GST number is required';
    } else if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(formData.gst_no)) {
      newErrors.gst_no = 'Please enter a valid GST number';
    }

    if (!formData.pan_no.trim()) {
      newErrors.pan_no = 'PAN number is required';
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_no)) {
      newErrors.pan_no = 'Please enter a valid PAN number';
    }

    // MSME document validation - Crucial check
    if (formData.is_msme && !formData.document_id) {
        newErrors.document_id = 'MSME registration document is required.';
    }

    // Website validation (optional)
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid website URL (with http:// or https://)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error if needed
      const firstErrorField = Object.keys(errors).find(key => errors[key]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error in form submission:", error);
    }
  };

  // Handlers for MSME DocumentUploadModal
  const handleMsmeDocumentUploadSuccess = (documentId: string) => {
    updateFormData('document_id', documentId);
    console.log("documentId", documentId);
    setIsMsmeUploadModalOpen(false); // Close modal after successful upload
  };

  // Handlers for adding new Document Categories (for MSME document upload)
  const handleAddDocumentCategory = async () => {
    if (!newDocumentCategoryName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    try {
      if (documentCategoryObject) {
        const updatedItems = [
          ...documentCategoryObject.items,
          newDocumentCategoryName.trim(),
        ];
        const res = await CategoryApis.updateCategories(
          documentCategoryObject._id,
          { items: updatedItems }
        );
        if (res.status === 200) {
          alert(`Category "${newDocumentCategoryName}" added successfully!`);
          // Re-fetch categories to update the dropdown in DocumentUploadModal
          const updatedCategoriesRes = await CategoryApis.getAllCategories();
          if (updatedCategoriesRes.status === 200) {
            const docCategory = updatedCategoriesRes.data.find(
              (cat: Category) => cat.type === "Document-Category"
            );
            if (docCategory) {
              setDocumentCategories(docCategory.items);
              setDocumentCategoryObject(docCategory);
            }
          }
          setNewDocumentCategoryName("");
          setIsAddDocumentCategoryModalOpen(false); // Close add category modal
        }
      } else {
        const res = await CategoryApis.createCategory({
          type: "Document-Category",
          items: [newDocumentCategoryName.trim()],
        });
        if (res.status === 201) {
          alert(`Category "${newDocumentCategoryName}" added successfully!`);
          // Re-fetch categories
          const updatedCategoriesRes = await CategoryApis.getAllCategories();
          if (updatedCategoriesRes.status === 200) {
            const docCategory = updatedCategoriesRes.data.find(
              (cat: Category) => cat.type === "Document-Category"
            );
            if (docCategory) {
              setDocumentCategories(docCategory.items);
              setDocumentCategoryObject(docCategory);
            }
          }
          setNewDocumentCategoryName("");
          setIsAddDocumentCategoryModalOpen(false); // Close add category modal
        }
      }
    } catch (error) {
      console.error("Error adding/updating category:", error);
      alert("Failed to add category. Please try again.");
    }
  };

  // Handlers for adding new Approved-For Categories
  const handleAddApprovedForCategory = async () => {
    if (!newApprovedForCategoryName.trim()) {
      alert("Category name cannot be empty.");
      return;
    }

    try {
      if (approvedForCategoryObject) {
        const updatedItems = [
          ...approvedForCategoryObject.items,
          newApprovedForCategoryName.trim(),
        ];
        const res = await CategoryApis.updateCategories(
          approvedForCategoryObject._id,
          { items: updatedItems }
        );
        if (res.status === 200) {
          alert(`Category "${newApprovedForCategoryName}" added successfully!`);
          // Re-fetch categories to update the dropdown
          const updatedCategoriesRes = await CategoryApis.getAllCategories();
          if (updatedCategoriesRes.status === 200) {
            const approvedForCat = updatedCategoriesRes.data.find(
              (cat: Category) => cat.type === "Approved-For-Category"
            );
            if (approvedForCat) {
              setApprovedForCategories(approvedForCat.items);
              setApprovedForCategoryObject(approvedForCat);
            }
          }
          setNewApprovedForCategoryName("");
          setIsAddApprovedForCategoryModalOpen(false); // Close add category modal
        }
      } else {
        const res = await CategoryApis.createCategory({
          type: "Approved-For-Category",
          items: [newApprovedForCategoryName.trim()],
        });
        if (res.status === 201) {
          alert(`Category "${newApprovedForCategoryName}" added successfully!`);
          // Re-fetch categories
          const updatedCategoriesRes = await CategoryApis.getAllCategories();
          if (updatedCategoriesRes.status === 200) {
            const approvedForCat = updatedCategoriesRes.data.find(
              (cat: Category) => cat.type === "Approved-For-Category"
            );
            if (approvedForCat) {
              setApprovedForCategories(approvedForCat.items);
              setApprovedForCategoryObject(approvedForCat);
            }
          }
          setNewApprovedForCategoryName("");
          setIsAddApprovedForCategoryModalOpen(false); // Close add category modal
        }
      }
    } catch (error) {
      console.error("Error adding/updating category:", error);
      alert("Failed to add category. Please try again.");
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{title}</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Company Information */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Approved For - Now a select field with dynamic categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Approved For <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.approved_for}
                  onChange={(e) => {
                    if (e.target.value === "add-new-approved-for-category") {
                      setIsAddApprovedForCategoryModalOpen(true);
                      updateFormData('approved_for', ''); // Clear selection for now
                    } else {
                      updateFormData('approved_for', e.target.value);
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.approved_for ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  id="approved_for" // Added ID for scrolling
                >
                  <option value="">-- Select approval category --</option>
                  {approvedForCategories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                  <option value="add-new-approved-for-category" className="font-bold">
                    + Add New Category
                  </option>
                </select>
                {errors.approved_for && (
                  <p className="mt-1 text-sm text-red-600">{errors.approved_for}</p>
                )}
              </div>
            </div>
            
            <div></div> {/* Empty div for spacing */}
            
            <div className="md:col-span-2">
              <InputField
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => updateFormData('company_name', e.target.value)}
                placeholder="Enter company name"
                required
                error={errors.company_name}
                id="company_name" // Added ID for scrolling
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.company_address}
                onChange={(e) => updateFormData('company_address', e.target.value)}
                placeholder="Enter complete company address"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.company_address ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                required
                id="company_address" // Added ID for scrolling
              />
              {errors.company_address && (
                <p className="mt-1 text-sm text-red-600">{errors.company_address}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => updateFormData('state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
                required
                id="state" // Added ID for scrolling
              >
                <option value="">-- Please select --</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            <InputField
              label="City"
              value={formData.city}
              onChange={(e) => updateFormData('city', e.target.value)}
              placeholder="Enter city"
              required
              error={errors.city}
              id="city" // Added ID for scrolling
            />

            <InputField
              label="Pin Code"
              value={formData.pincode}
              onChange={(e) => updateFormData('pincode', e.target.value)}
              placeholder="Enter pin code"
              required
              error={errors.pincode}
              maxLength={6}
              id="pincode" // Added ID for scrolling
            />

            <InputField
              label="Mobile No"
              value={formData.mobile_no}
              onChange={(e) => updateFormData('mobile_no', e.target.value)}
              placeholder="Enter mobile number"
              required
              error={errors.mobile_no}
              type="tel"
              id="mobile_no" // Added ID for scrolling
            />

            <InputField
              label="Phone No"
              value={formData.phone_no}
              onChange={(e) => updateFormData('phone_no', e.target.value)}
              placeholder="Enter phone number"
              type="tel"
            />

            <InputField
              label="Email Id"
              value={formData.mail}
              onChange={(e) => updateFormData('mail', e.target.value)}
              placeholder="Enter email address"
              required
              error={errors.mail}
              type="email"
              id="mail" // Added ID for scrolling
            />

            <InputField
              label="Website"
              value={formData.website}
              onChange={(e) => updateFormData('website', e.target.value)}
              placeholder="https://example.com"
              error={errors.website}
              type="url"
            />
          </div>

          {/* Company Type */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-4" id="company_type">
              Company Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(['Proprietorship', 'Partnership', 'Private Limited', 'Limited'] as const).map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="company_type"
                    value={type}
                    checked={formData.company_type === type}
                    onChange={(e) => updateFormData('company_type', e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{type}</span>
                </label>
              ))}
            </div>
            {errors.company_type && (
              <p className="mt-1 text-sm text-red-600">{errors.company_type}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <InputField
              label="Name of Partner/Directors"
              value={formData.partner_name}
              onChange={(e) => updateFormData('partner_name', e.target.value)}
              placeholder="Enter partner/director names"
            />

            <InputField
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => updateFormData('contact_person', e.target.value)}
              placeholder="Enter contact person name"
              required
              error={errors.contact_person}
              id="contact_person" // Added ID for scrolling
            />

            <div className="md:col-span-2">
              <InputField
                label="Contact Designation"
                value={formData.contact_designation}
                onChange={(e) => updateFormData('contact_designation', e.target.value)}
                placeholder="Enter contact person designation"
                required
                error={errors.contact_designation}
                id="contact_designation" // Added ID for scrolling
              />
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Banking Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Name - Now an input field */}
            <InputField
              label="Bank Name"
              value={formData.bank_name}
              onChange={(e) => updateFormData('bank_name', e.target.value)}
              placeholder="Enter bank name"
              required
              error={errors.bank_name}
              id="bank_name" // Added ID for scrolling
            />

            <InputField
              label="Branch Name"
              value={formData.branch_name}
              onChange={(e) => updateFormData('branch_name', e.target.value)}
              placeholder="Enter branch name"
              required
              error={errors.branch_name}
              id="branch_name" // Added ID for scrolling
            />

            <InputField
              label="Bank Account Number"
              value={formData.bank_account_no}
              onChange={(e) => updateFormData('bank_account_no', e.target.value)}
              placeholder="Enter account number"
              required
              error={errors.bank_account_no}
              id="bank_account_no" // Added ID for scrolling
            />

            <InputField
              label="Bank IFSC Code"
              value={formData.bank_ifsc}
              onChange={(e) => updateFormData('bank_ifsc', e.target.value.toUpperCase())}
              placeholder="Enter IFSC code"
              required
              error={errors.bank_ifsc}
              maxLength={11}
              id="bank_ifsc" // Added ID for scrolling
            />

            <InputField
              label="Bank MICR Code"
              value={formData.bank_micr_code}
              onChange={(e) => updateFormData('bank_micr_code', e.target.value)}
              placeholder="Enter MICR code"
            />

            <InputField
              label="SWIFT Code"
              value={formData.bank_swift_code}
              onChange={(e) => updateFormData('bank_swift_code', e.target.value.toUpperCase())}
              placeholder="Enter SWIFT code"
            />
          </div>
        </div>

        {/* GST Registration Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">GST Registration Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="GST NUMBER"
              value={formData.gst_no}
              onChange={(e) => updateFormData('gst_no', e.target.value.toUpperCase())}
              placeholder="Enter GST number"
              required
              error={errors.gst_no}
              maxLength={15}
              id="gst_no" // Added ID for scrolling
            />

            <InputField
              label="PAN NO."
              value={formData.pan_no}
              onChange={(e) => updateFormData('pan_no', e.target.value.toUpperCase())}
              placeholder="Enter PAN number"
              required
              error={errors.pan_no}
              maxLength={10}
              id="pan_no" // Added ID for scrolling
            />
          </div>

          {/* MSME Unit */}
          <div className="mt-6">
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-700">ARE YOU AN MSME UNIT?</span>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_msme"
                  checked={formData.is_msme === true}
                  onChange={() => updateFormData('is_msme', true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_msme"
                  checked={formData.is_msme === false}
                  onChange={() => updateFormData('is_msme', false)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">NO</span>
              </label>
            </div>

            {formData.is_msme && (
              <div className="mt-4 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2" id="document_id">
                    MSME Registration Document <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setIsMsmeUploadModalOpen(true)}
                        className="px-4 py-2"
                    >
                        {formData.document_id ? "Change Document" : "Upload Document"}
                    </Button>
                    {/* Visual confirmation */}
                    {formData.document_id && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="h-4 w-4" /> Document Uploaded!
                        </span>
                    )}
                </div>
                {errors.document_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.document_id}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? 'Saving...' : submitButtonText}
          </Button>
        </div>
      </form>

      {/* MSME Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isMsmeUploadModalOpen}
        onClose={() => setIsMsmeUploadModalOpen(false)}
        onUploadSuccess={handleMsmeDocumentUploadSuccess}
        documentCategories={documentCategories}
        isAddingCategory={isAddDocumentCategoryModalOpen}
        onAddCategory={() => setIsAddDocumentCategoryModalOpen(prev => !prev)} // Toggle add category modal
        onNewCategoryNameChange={setNewDocumentCategoryName}
        onAddCategorySubmit={handleAddDocumentCategory}
        newCategoryName={newDocumentCategoryName}
      />

      {/* Add New Approved-For Category Modal */}
      {isAddApprovedForCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Add New Approval Category
              </h2>
              <button
                onClick={() => setIsAddApprovedForCategoryModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <InputField
                  type="text"
                  value={newApprovedForCategoryName}
                  onChange={(e) => setNewApprovedForCategoryName(e.target.value)}
                  placeholder="Enter new category name..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddApprovedForCategoryModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddApprovedForCategory}
                  disabled={!newApprovedForCategoryName.trim()}
                  className="flex-1"
                >
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorForm;
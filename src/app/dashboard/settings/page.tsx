"use client"
import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import OrgApis from '@/actions/Apis/OrgApis';

// Define the type for the organization data we'll use in the form
interface OrganizationFormState {
  name: string;
  company_address: string;
  logo: string | File | null;
  prefixes: Array<{ title: string; format: string }>;
  id: string;
  isLogoEdited: boolean;
}

const PREFIX_OPTIONS = ['Batch', 'Order', 'Invoice', 'Product', 'Customer'];

const SettingsPage = () => {
  const { organization, isLoading, fetchOrgDetails } = useUser();
  const [formData, setFormData] = useState<OrganizationFormState>({
    id: '',
    name: '',
    company_address: '',
    logo: null,
    prefixes: [],
    isLogoEdited: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newPrefix, setNewPrefix] = useState({ title: '', format: '' });
  const [errors, setErrors] = useState({ prefixes: '' });

  // Effect to populate the form data when the organization data is available
  useEffect(() => {
    if (organization) {
      setFormData({
        id: organization._id,
        name: organization.name,
        company_address: organization.company_address || '',
        logo: organization.logo || null,
        prefixes: organization.prefixes || [],
        isLogoEdited: false,
      });
    }
  }, [organization]);

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle file input change for the logo
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prevData) => ({
        ...prevData,
        logo: file,
        isLogoEdited: true,
      }));
    }
  };

  // Handle changes for the existing prefixes
  const handlePrefixChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newPrefixes = [...formData.prefixes];
    newPrefixes[index] = { ...newPrefixes[index], [name]: value };
    setFormData((prevData) => ({
      ...prevData,
      prefixes: newPrefixes,
    }));
  };

  // Remove an existing prefix
  const handleRemovePrefix = (index: number) => {
    const newPrefixes = formData.prefixes.filter((_, i) => i !== index);
    setFormData((prevData) => ({
      ...prevData,
      prefixes: newPrefixes,
    }));
  };

  // Handle changes for the new prefix being added
  const handleNewPrefixChange = (field: 'title' | 'format', value: string) => {
    setNewPrefix((prev) => ({ ...prev, [field]: value }));
  };

  // Add a new prefix to the list
  const handleAddNewPrefix = () => {
    setErrors({ prefixes: '' });
    if (!newPrefix.title || !newPrefix.format) {
      setErrors({ prefixes: 'Prefix type and format are required.' });
      return;
    }

    const isDuplicate = formData.prefixes.some(
      (p) => p.title.toLowerCase() === newPrefix.title.toLowerCase()
    );

    if (isDuplicate) {
      setErrors({ prefixes: 'A prefix with this title already exists.' });
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      prefixes: [...prevData.prefixes, newPrefix],
    }));
    setNewPrefix({ title: '', format: '' }); // Reset new prefix fields
  };

  // Handle form submission
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;

    try {
      setIsSubmitting(true);
      let res;
      // If a new logo is selected, use FormData
      if (formData.isLogoEdited && formData.logo instanceof File) {
        const formDataPayload = new FormData();
        formDataPayload.append('name', formData.name);
        formDataPayload.append('company_address', formData.company_address);
        formDataPayload.append('logo', formData.logo);
        formDataPayload.append('prefixes', JSON.stringify(formData.prefixes));
        formDataPayload.append('isActive', organization?.isActive.toString() || 'true');
        formDataPayload.append('settings', JSON.stringify({}));
        res = await OrgApis.editOrgWithFormData(formDataPayload, formData.id);
      } else {
        // Otherwise, use a regular JSON payload
        const payload = {
          name: formData.name,
          company_address: formData.company_address,
          prefixes: formData.prefixes,
          isActive: organization?.isActive || true,
          settings: {},
        };
        res = await OrgApis.editOrg(payload, formData.id);
      }

      if (res.status === 200) {
        await fetchOrgDetails(formData.id);
      } else {
      }
    } catch (error: any) {
      console.error("Error updating organization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Loading organization data...</div>;
  }

  if (!organization) {
    return <div>No organization data found.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>
      <form onSubmit={handleEditSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Organization Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Address Field */}
        <div>
          <label htmlFor="company_address" className="block text-sm font-medium text-gray-700">Company Address</label>
          <textarea
            id="company_address"
            name="company_address"
            value={formData.company_address}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>

        {/* Logo Field */}
        <div>
          <label htmlFor="logo" className="block text-sm font-medium text-gray-700">Logo</label>
          <div className="mt-1 flex items-center space-x-4">
            {formData.logo && (
              <div className="flex-shrink-0">
                {typeof formData.logo === 'string' ? (
                  <img
                    src={formData.logo}
                    alt="Current Logo"
                    className="h-24 w-24 object-contain rounded-md border"
                  />
                ) : (
                  <img
                    src={URL.createObjectURL(formData.logo)}
                    alt="New Logo Preview"
                    className="h-24 w-24 object-contain rounded-md border"
                  />
                )}
              </div>
            )}
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
        </div>

        {/* Prefixes Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Prefixes</label>
          
          {/* Add New Prefix Section */}
          <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Prefix:</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Prefix Type
                </label>
                <select
                  value={newPrefix.title}
                  onChange={(e) => handleNewPrefixChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="" disabled>Select a type</option>
                  {PREFIX_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Format Pattern *
                </label>
                <input
                  type="text"
                  value={newPrefix.format}
                  onChange={(e) => handleNewPrefixChange('format', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., BATCH-2024-###"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use ### for numbers
                </p>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddNewPrefix}
                  className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                >
                  {/* Plus Icon (inline SVG) */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Add
                </button>
              </div>
            </div>
            {errors.prefixes && (
              <p className="mt-2 text-sm text-red-600">{errors.prefixes}</p>
            )}
          </div>

          {/* Existing Prefixes List */}
          <div className="space-y-4 mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Prefixes:</h4>
            {formData.prefixes.length > 0 ? (
              formData.prefixes.map((prefix, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-md bg-white">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={prefix.title}
                      onChange={(e) => handlePrefixChange(index, e)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500">Format</label>
                    <input
                      type="text"
                      name="format"
                      value={prefix.format}
                      onChange={(e) => handlePrefixChange(index, e)}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemovePrefix(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    {/* Trash Can Icon (inline SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.275-2.339.575a1.5 1.5 0 10.861 2.735 18.995 18.995 0 012.653-.815l.628-.216a2.75 2.75 0 001.455-.443H16.25a.75.75 0 000-1.5H9.75a.75.75 0 000-1.5H5.894a.75.75 0 00-.63.364L4.76 2.75H8.75V1zM10 7a.75.75 0 01.75.75v5.5a.75.75 0 11-1.5 0v-5.5A.75.75 0 0110 7zm-3.75.75a.75.75 0 01.75.75v5.5a.75.75 0 11-1.5 0v-5.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No prefixes added. Add one above.</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
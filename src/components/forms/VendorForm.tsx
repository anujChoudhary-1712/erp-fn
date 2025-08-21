/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/ReusableComponents/Button";
import InputField from "@/components/ReusableComponents/InputField";
import CategoryApis from "@/actions/Apis/CategoryApis";
import DocumentUploadModal from "../modal/DocumentUploadModal";
import { X, CheckCircle, Upload, FileText, Trash2 } from "lucide-react";

interface DocumentItem {
  name: string;
  document: string;
  fileName?: string;
  uploadedAt?: string;
}

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
  company_type:
    | "Proprietorship"
    | "Partnership"
    | "Private Limited"
    | "Limited"
    | "";
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
  reg_document_id?: string;
  documents: DocumentItem[];
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

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
];

const VendorForm: React.FC<VendorFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false,
  submitButtonText = "Save Vendor",
  title = "Vendor Registration",
}) => {
  const [formData, setFormData] = useState<VendorFormData>({
    approved_for: "",
    company_name: "",
    company_address: "",
    state: "",
    city: "",
    pincode: "",
    mobile_no: "",
    phone_no: "",
    mail: "",
    website: "",
    company_type: "",
    partner_name: "",
    contact_person: "",
    contact_designation: "",
    bank_name: "",
    branch_name: "",
    bank_ifsc: "",
    bank_account_no: "",
    bank_micr_code: "",
    bank_swift_code: "",
    gst_no: "",
    pan_no: "",
    is_msme: false,
    reg_document_id: undefined,
    documents: [],
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMsmeUploadModalOpen, setIsMsmeUploadModalOpen] =
    useState<boolean>(false);
  const [isDocumentUploadModalOpen, setIsDocumentUploadModalOpen] =
    useState<boolean>(false);
  const [documentCategories, setDocumentCategories] = useState<string[]>([]);
  const [isAddDocumentCategoryModalOpen, setIsAddDocumentCategoryModalOpen] =
    useState<boolean>(false);
  const [newDocumentCategoryName, setNewDocumentCategoryName] =
    useState<string>("");
  const [documentCategoryObject, setDocumentCategoryObject] =
    useState<Category | null>(null);

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
          }
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  useEffect(() => {
    if (formData.is_msme) {
      const newErrors = { ...errors };
      if (!formData.reg_document_id) {
        newErrors.reg_document_id = "MSME registration document is required.";
      } else {
        delete newErrors.reg_document_id;
      }
      setErrors(newErrors);
    }
  }, [formData.reg_document_id, formData.is_msme]);

  const updateFormData = (
    field: keyof VendorFormData,
    value: string | boolean | undefined | DocumentItem[]
  ): void => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    if (field === "is_msme" && value === false) {
      setFormData((prev) => ({ ...prev, reg_document_id: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.approved_for.trim()) {
      newErrors.approved_for = "Approval category is required";
    }
    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    }
    if (!formData.company_address.trim()) {
      newErrors.company_address = "Company address is required";
    }
    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }
    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.pincode.trim()) {
      newErrors.pincode = "Pin code is required";
    } else if (!/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pin code must be 6 digits";
    }
    if (!formData.mobile_no.trim()) {
      newErrors.mobile_no = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile_no.replace(/[^\d]/g, ""))) {
      newErrors.mobile_no = "Please enter a valid 10-digit mobile number";
    }
    if (!formData.mail.trim()) {
      newErrors.mail = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
      newErrors.mail = "Please enter a valid email address";
    }
    if (!formData.company_type) {
      newErrors.company_type = "Company type is required";
    }
    if (!formData.contact_person.trim()) {
      newErrors.contact_person = "Contact person is required";
    }
    if (!formData.contact_designation.trim()) {
      newErrors.contact_designation = "Contact designation is required";
    }
    if (!formData.bank_name.trim()) {
      newErrors.bank_name = "Bank name is required";
    }
    if (!formData.branch_name.trim()) {
      newErrors.branch_name = "Branch name is required";
    }
    if (!formData.bank_ifsc.trim()) {
      newErrors.bank_ifsc = "IFSC code is required";
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_ifsc)) {
      newErrors.bank_ifsc = "Please enter a valid IFSC code";
    }
    if (!formData.bank_account_no.trim()) {
      newErrors.bank_account_no = "Bank account number is required";
    }
    if (!formData.gst_no.trim()) {
      newErrors.gst_no = "GST number is required";
    } else if (
      !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(
        formData.gst_no
      )
    ) {
      newErrors.gst_no = "Please enter a valid GST number";
    }
    if (!formData.pan_no.trim()) {
      newErrors.pan_no = "PAN number is required";
    } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_no)) {
      newErrors.pan_no = "Please enter a valid PAN number";
    }
    if (formData.is_msme && !formData.reg_document_id) {
      newErrors.reg_document_id = "MSME registration document is required.";
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website =
        "Please enter a valid website URL (with http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors).find((key) => errors[key]);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
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

  const handleMsmeDocumentUploadSuccess = (documentId: string) => {
    updateFormData("reg_document_id", documentId);
    setIsMsmeUploadModalOpen(false);
  };

  const handleDocumentUploadSuccess = (
    documentId: string,
    documentName: string,
    fileName?: string
  ) => {
    const newDocument: DocumentItem = {
      name: documentName,
      document: documentId,
      fileName: fileName,
      uploadedAt: new Date().toISOString(),
    };

    updateFormData("documents", [...formData.documents, newDocument]);
    setIsDocumentUploadModalOpen(false);
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = formData.documents.filter((_, i) => i !== index);
    updateFormData("documents", updatedDocuments);
  };

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
          setIsAddDocumentCategoryModalOpen(false);
        }
      } else {
        const res = await CategoryApis.createCategory({
          type: "Document-Category",
          items: [newDocumentCategoryName.trim()],
        });
        if (res.status === 201) {
          alert(`Category "${newDocumentCategoryName}" added successfully!`);
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
          setIsAddDocumentCategoryModalOpen(false);
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
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Company Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="approved_for"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Approved For <span className="text-red-500">*</span>
              </label>
              <select
                id="approved_for"
                value={formData.approved_for}
                onChange={(e) => updateFormData("approved_for", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.approved_for ? "border-red-500" : "border-gray-300"
                }`}
                required
              >
                <option value="">-- Select a category --</option>
                {["Machinery", "Material", "Miscellaneous"].map((category) => (
                  <option key={category} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.approved_for && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.approved_for}
                </p>
              )}
            </div>

            <div></div>

            <div className="md:col-span-2">
              <InputField
                label="Company Name"
                value={formData.company_name}
                onChange={(e) => updateFormData("company_name", e.target.value)}
                placeholder="Enter company name"
                required
                error={errors.company_name}
                id="company_name"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Address <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.company_address}
                onChange={(e) =>
                  updateFormData("company_address", e.target.value)
                }
                placeholder="Enter complete company address"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.company_address ? "border-red-500" : "border-gray-300"
                }`}
                rows={3}
                required
                id="company_address"
              />
              {errors.company_address && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.company_address}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.state}
                onChange={(e) => updateFormData("state", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.state ? "border-red-500" : "border-gray-300"
                }`}
                required
                id="state"
              >
                <option value="">-- Please select --</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-sm text-red-600">{errors.state}</p>
              )}
            </div>

            <InputField
              label="City"
              value={formData.city}
              onChange={(e) => updateFormData("city", e.target.value)}
              placeholder="Enter city"
              required
              error={errors.city}
              id="city"
            />

            <InputField
              label="Pin Code"
              value={formData.pincode}
              onChange={(e) => updateFormData("pincode", e.target.value)}
              placeholder="Enter pin code"
              required
              error={errors.pincode}
              maxLength={6}
              id="pincode"
            />

            <InputField
              label="Mobile No"
              value={formData.mobile_no}
              onChange={(e) => updateFormData("mobile_no", e.target.value)}
              placeholder="Enter mobile number"
              required
              error={errors.mobile_no}
              type="tel"
              id="mobile_no"
            />

            <InputField
              label="Phone No"
              value={formData.phone_no}
              onChange={(e) => updateFormData("phone_no", e.target.value)}
              placeholder="Enter phone number"
              type="tel"
            />

            <InputField
              label="Email Id"
              value={formData.mail}
              onChange={(e) => updateFormData("mail", e.target.value)}
              placeholder="Enter email address"
              required
              error={errors.mail}
              type="email"
              id="mail"
            />

            <InputField
              label="Website"
              value={formData.website}
              onChange={(e) => updateFormData("website", e.target.value)}
              placeholder="https://example.com"
              error={errors.website}
              type="url"
            />
          </div>

          <div className="mt-6">
            <label
              className="block text-sm font-medium text-gray-700 mb-4"
              id="company_type"
            >
              Company Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(
                [
                  "Proprietorship",
                  "Partnership",
                  "Private Limited",
                  "Limited",
                ] as const
              ).map((type) => (
                <label key={type} className="flex items-center">
                  <input
                    type="radio"
                    name="company_type"
                    value={type}
                    checked={formData.company_type === type}
                    onChange={(e) =>
                      updateFormData("company_type", e.target.value)
                    }
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
              onChange={(e) => updateFormData("partner_name", e.target.value)}
              placeholder="Enter partner/director names"
            />

            <InputField
              label="Contact Person"
              value={formData.contact_person}
              onChange={(e) => updateFormData("contact_person", e.target.value)}
              placeholder="Enter contact person name"
              required
              error={errors.contact_person}
              id="contact_person"
            />

            <div className="md:col-span-2">
              <InputField
                label="Contact Designation"
                value={formData.contact_designation}
                onChange={(e) =>
                  updateFormData("contact_designation", e.target.value)
                }
                placeholder="Enter contact person designation"
                required
                error={errors.contact_designation}
                id="contact_designation"
              />
            </div>
          </div>
        </div>

        {/* Banking Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Banking Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Bank Name"
              value={formData.bank_name}
              onChange={(e) => updateFormData("bank_name", e.target.value)}
              placeholder="Enter bank name"
              required
              error={errors.bank_name}
              id="bank_name"
            />

            <InputField
              label="Branch Name"
              value={formData.branch_name}
              onChange={(e) => updateFormData("branch_name", e.target.value)}
              placeholder="Enter branch name"
              required
              error={errors.branch_name}
              id="branch_name"
            />

            <InputField
              label="Bank Account Number"
              value={formData.bank_account_no}
              onChange={(e) =>
                updateFormData("bank_account_no", e.target.value)
              }
              placeholder="Enter account number"
              required
              error={errors.bank_account_no}
              id="bank_account_no"
            />

            <InputField
              label="Bank IFSC Code"
              value={formData.bank_ifsc}
              onChange={(e) =>
                updateFormData("bank_ifsc", e.target.value.toUpperCase())
              }
              placeholder="Enter IFSC code"
              required
              error={errors.bank_ifsc}
              maxLength={11}
              id="bank_ifsc"
            />

            <InputField
              label="Bank MICR Code"
              value={formData.bank_micr_code}
              onChange={(e) => updateFormData("bank_micr_code", e.target.value)}
              placeholder="Enter MICR code"
            />

            <InputField
              label="SWIFT Code"
              value={formData.bank_swift_code}
              onChange={(e) =>
                updateFormData("bank_swift_code", e.target.value.toUpperCase())
              }
              placeholder="Enter SWIFT code"
            />
          </div>
        </div>

        {/* GST Registration Details */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            GST Registration Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="GST NUMBER"
              value={formData.gst_no}
              onChange={(e) =>
                updateFormData("gst_no", e.target.value.toUpperCase())
              }
              placeholder="Enter GST number"
              required
              error={errors.gst_no}
              maxLength={15}
              id="gst_no"
            />

            <InputField
              label="PAN NO."
              value={formData.pan_no}
              onChange={(e) =>
                updateFormData("pan_no", e.target.value.toUpperCase())
              }
              placeholder="Enter PAN number"
              required
              error={errors.pan_no}
              maxLength={10}
              id="pan_no"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center space-x-6">
              <span className="text-sm font-medium text-gray-700">
                ARE YOU AN MSME UNIT?
              </span>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_msme"
                  checked={formData.is_msme === true}
                  onChange={() => updateFormData("is_msme", true)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="is_msme"
                  checked={formData.is_msme === false}
                  onChange={() => updateFormData("is_msme", false)}
                  className="mr-2 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">NO</span>
              </label>
            </div>

            {formData.is_msme && (
              <div className="mt-4 max-w-md">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  id="reg_document_id"
                >
                  MSME Registration Document{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsMsmeUploadModalOpen(true)}
                    className="px-4 py-2"
                  >
                    {formData.reg_document_id
                      ? "Change Document"
                      : "Upload Document"}
                  </Button>
                  {formData.reg_document_id && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Document Uploaded!
                    </span>
                  )}
                </div>
                {errors.reg_document_id && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.reg_document_id}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Documents Section */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Additional Documents
            </h2>
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsDocumentUploadModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>

          {formData.documents.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600 mb-3">No documents uploaded</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsDocumentUploadModalOpen(true)}
                className="flex items-center gap-2 mx-auto"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {formData.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {doc.name}
                      </p>
                      {doc.fileName && (
                        <p className="text-xs text-gray-500">{doc.fileName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Uploaded
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemoveDocument(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="min-w-32"
          >
            {isLoading ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>

      <DocumentUploadModal
        isOpen={isMsmeUploadModalOpen}
        onClose={() => setIsMsmeUploadModalOpen(false)}
        onUploadSuccess={handleMsmeDocumentUploadSuccess}
        uploadType="msme"
      />

      <DocumentUploadModal
        isOpen={isDocumentUploadModalOpen}
        onClose={() => setIsDocumentUploadModalOpen(false)}
        onUploadSuccess={handleDocumentUploadSuccess}
        uploadType="general"
      />
    </div>
  );
};

export default VendorForm;

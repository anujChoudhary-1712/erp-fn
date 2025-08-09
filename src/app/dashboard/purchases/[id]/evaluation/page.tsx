"use client"
import PurchaseReqApis from '@/actions/Apis/PurchaseReqApis'
import VendorApis from '@/actions/Apis/VendorApis'
import Button from '@/components/ReusableComponents/Button'
import { useSearchParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

// TypeScript interfaces
interface Vendor {
  _id: string
  company_name: string
  status: string
  state: string
  city: string
  contact_person: string
}

interface VendorEvaluation {
  vendorId: string | {
    _id: string
    company_name: string
    [key: string]: any
  }
  name: string
  availability: boolean
  price: number
  isRecommended: boolean
  isSelected?: boolean
}

const VendorEvaluationPage = ({ params }: { params: { id: string } }) => {
  const searchParams = useSearchParams()
  const isSelectionMode = searchParams.get('selection') === 'required'
  
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [selectedVendors, setSelectedVendors] = useState<VendorEvaluation[]>([])
  const [currentVendor, setCurrentVendor] = useState<VendorEvaluation>({
    vendorId: '',
    name: '',
    availability: true,
    price: 0,
    isRecommended: false
  })
  
  const [purchaseDetails, setPurchaseDetails] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  
  // For vendor selection mode
  const [selectedVendorId, setSelectedVendorId] = useState<string>('')
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('')
  
  const router = useRouter()

  // Get min date for estimated delivery (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Fetch vendors and purchase details
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch purchase details
        const purchaseRes = await PurchaseReqApis.getSinglePurchase(params.id)
        if (purchaseRes.status === 200) {
          setPurchaseDetails(purchaseRes.data.requirement)
          
          // If vendors were already evaluated, load them
          if (purchaseRes.data.requirement.vendorsEvaluated && 
              purchaseRes.data.requirement.vendorsEvaluated.length > 0) {
            
            // Format the vendorsEvaluated data for our state
            const formattedVendors = purchaseRes.data.requirement.vendorsEvaluated.map((vendor: any) => {
              // Handle both object and string vendorId formats
              const vendorIdValue = typeof vendor.vendorId === 'object' ? vendor.vendorId._id : vendor.vendorId
              
              return {
                vendorId: vendorIdValue,
                name: vendor.name,
                availability: vendor.availability,
                price: vendor.price,
                isRecommended: vendor.isRecommended,
                isSelected: vendor.isSelected || false,
                // Store the original vendor object for display
                vendorObj: typeof vendor.vendorId === 'object' ? vendor.vendorId : null
              }
            })
            
            setSelectedVendors(formattedVendors)
            
            // Set recommended vendor as selected by default in selection mode
            if (isSelectionMode) {
              const recommendedVendor = formattedVendors.find(v => v.isRecommended)
              if (recommendedVendor) {
                setSelectedVendorId(recommendedVendor.vendorId as string)
              }
            }
          }
        } else {
          setError("Failed to fetch purchase details")
        }

        // Only fetch vendors if not in selection mode
        if (!isSelectionMode) {
          const vendorsRes = await VendorApis.getAllVendors()
          if (vendorsRes.status === 200) {
            // Filter vendors with "approved" status
            const approvedVendors = vendorsRes.data.filter((vendor: Vendor) => 
              vendor.status.toLowerCase() === 'approved'
            )
            setVendors(approvedVendors)
          } else {
            setError("Failed to fetch vendors")
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("An error occurred while fetching data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.id, isSelectionMode])

  // Handle vendor selection
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vendorId = e.target.value
    if (!vendorId) return

    const selectedVendor = vendors.find(v => v._id === vendorId)
    if (selectedVendor) {
      setCurrentVendor({
        vendorId: selectedVendor._id,
        name: selectedVendor.company_name,
        availability: true,
        price: 0,
        isRecommended: false
      })
    }
  }

  // Handle availability change
  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentVendor({
      ...currentVendor,
      availability: e.target.value === 'yes'
    })
  }

  // Handle price change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const price = parseFloat(e.target.value) || 0
    setCurrentVendor({
      ...currentVendor,
      price: price
    })
  }

  // Handle recommendation change
  const handleRecommendationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isRecommended = e.target.checked
    
    setCurrentVendor({
      ...currentVendor,
      isRecommended
    })
  }

  // Add vendor to the list
  const addVendor = () => {
    // Validate form
    if (!currentVendor.vendorId) {
      setError("Please select a vendor")
      return
    }

    if (currentVendor.price <= 0) {
      setError("Please enter a valid price")
      return
    }

    // Check if vendor already exists in the list
    if (selectedVendors.some(v => v.vendorId === currentVendor.vendorId)) {
      setError("This vendor is already added to the evaluation list")
      return
    }

    let updatedVendors = [...selectedVendors]
    
    // If current vendor is recommended, unset recommendation for all others
    if (currentVendor.isRecommended) {
      updatedVendors = updatedVendors.map(vendor => ({
        ...vendor,
        isRecommended: false
      }))
    }
    
    // Add the new vendor
    updatedVendors.push(currentVendor)
    setSelectedVendors(updatedVendors)
    
    // Reset current vendor form
    setCurrentVendor({
      vendorId: '',
      name: '',
      availability: true,
      price: 0,
      isRecommended: false
    })
    
    // Clear any error
    setError('')
  }

  // Remove vendor from the list
  const removeVendor = (index: number) => {
    const updatedVendors = [...selectedVendors]
    updatedVendors.splice(index, 1)
    setSelectedVendors(updatedVendors)
  }

  // Toggle recommendation for a vendor in the list
  const toggleRecommendation = (index: number) => {
    const updatedVendors = [...selectedVendors]
    
    // If toggling to recommended, unset recommendation for all others
    if (!updatedVendors[index].isRecommended) {
      updatedVendors.forEach((vendor, i) => {
        if (i !== index) {
          vendor.isRecommended = false
        }
      })
      updatedVendors[index].isRecommended = true
    } else {
      // If toggling off recommendation, just update that vendor
      updatedVendors[index].isRecommended = false
    }
    
    setSelectedVendors(updatedVendors)
  }

  // Select a vendor (in selection mode)
  const handleVendorSelect = (vendorId: string) => {
    setSelectedVendorId(vendorId)
  }

  // Submit vendor evaluations
  const handleVendorEvaluation = async () => {
    if (selectedVendors.length === 0) {
      setError("Please add at least one vendor to evaluate")
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        vendors: selectedVendors.map(vendor => ({
          vendorId: vendor.vendorId,
          name: vendor.name,
          availability: vendor.availability,
          price: vendor.price,
          isRecommended: vendor.isRecommended
        }))
      }
      
      const res = await PurchaseReqApis.evaluateVendors(params.id, payload)
      
      if (res.status === 200) {
        setSuccess("Vendor evaluation submitted successfully")
        // Redirect after a delay
        setTimeout(() => {
          router.push(`/dashboard/purchases/${params.id}`)
        }, 2000)
      } else {
        setError("Failed to submit vendor evaluation")
      }
    } catch (error) {
      console.error("Error submitting vendor evaluation:", error)
      setError("An error occurred while submitting the evaluation")
    } finally {
      setSubmitting(false)
    }
  }

  // Submit vendor selection
  const handleVendorSelection = async () => {
    if (!selectedVendorId) {
      setError("Please select a vendor")
      return
    }

    if (!estimatedDeliveryDate) {
      setError("Please select an estimated delivery date")
      return
    }

    setSubmitting(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        vendorId: selectedVendorId,
        estimatedDeliveryDate: new Date(estimatedDeliveryDate).toISOString()
      }
      
      const res = await PurchaseReqApis.selectVendor(params.id, payload)
      
      if (res.status === 200) {
        setSuccess("Vendor selected successfully")
        // Redirect after a delay
        setTimeout(() => {
          router.push(`/dashboard/purchases/${params.id}`)
        }, 2000)
      } else {
        setError("Failed to select vendor")
      }
    } catch (error) {
      console.error("Error selecting vendor:", error)
      setError("An error occurred while selecting the vendor")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="text-gray-600 font-medium">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {isSelectionMode ? 'Select Vendor' : 'Vendor Evaluation'}
              </h1>
              <p className="text-gray-600 mt-1">
                {purchaseDetails?.purchaseRequestType} Purchase Requirement
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Selection Mode UI */}
        {isSelectionMode ? (
          <div className="space-y-6">
            {/* Estimated Delivery Date */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Delivery Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  value={estimatedDeliveryDate}
                  onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Vendor Selection Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Vendor</h2>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vendor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price (₹)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Availability
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Recommended
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedVendors.map((vendor, index) => (
                      <tr key={index} className={selectedVendorId === vendor.vendorId ? "bg-blue-50" : ""}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input
                              type="radio"
                              name="vendorSelection"
                              checked={selectedVendorId === vendor.vendorId}
                              onChange={() => handleVendorSelect(vendor.vendorId as string)}
                              className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{vendor.price.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            vendor.availability 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {vendor.availability ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {vendor.isRecommended ? (
                              <span className="text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleVendorSelection}
                disabled={submitting || !selectedVendorId || !estimatedDeliveryDate}
                className="min-w-32"
              >
                {submitting ? 'Processing...' : 'Confirm Selection'}
              </Button>
            </div>
          </div>
        ) : (
          /* Evaluation Mode UI */
          <>
            {/* Add Vendor Form */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Vendor Evaluation</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Vendor Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentVendor.vendorId as string}
                    onChange={handleVendorChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option 
                        key={vendor._id} 
                        value={vendor._id}
                        disabled={selectedVendors.some(v => v.vendorId === vendor._id)}
                      >
                        {vendor.company_name} ({vendor.city}, {vendor.state})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={currentVendor.price || ''}
                    onChange={handlePriceChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter price"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability
                  </label>
                  <select
                    value={currentVendor.availability ? 'yes' : 'no'}
                    onChange={handleAvailabilityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                
                {/* Recommended */}
                <div className="flex items-center h-full pt-6">
                  <input
                    type="checkbox"
                    id="recommended"
                    checked={currentVendor.isRecommended}
                    onChange={handleRecommendationChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="recommended" className="ml-2 block text-sm text-gray-700">
                    Recommended Vendor
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addVendor}
                  disabled={!currentVendor.vendorId || currentVendor.price <= 0}
                  className="px-4"
                >
                  Add Vendor
                </Button>
              </div>
            </div>

            {/* Vendor List */}
            {selectedVendors.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Evaluation List</h2>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vendor
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price (₹)
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Availability
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Recommended
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedVendors.map((vendor, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{vendor.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vendor.price.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vendor.availability 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {vendor.availability ? 'Yes' : 'No'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={vendor.isRecommended}
                                onChange={() => toggleRecommendation(index)}
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => removeVendor(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                onClick={handleVendorEvaluation}
                disabled={submitting || selectedVendors.length === 0}
                className="min-w-32"
              >
                {submitting ? 'Submitting...' : 'Submit Evaluation'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default VendorEvaluationPage
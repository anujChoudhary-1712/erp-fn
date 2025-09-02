"use client"
import CategoryApis from '@/actions/Apis/CategoryApis';
import React, { useEffect, useState, FormEvent, KeyboardEvent } from 'react';

// Define interfaces for your data structures
interface Category {
  _id: string;
  type: string;
  items: string[];
}

interface NewCategoryData {
  type: string;
  items: string[];
}

const CategoryPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [newCategoryData, setNewCategoryData] = useState<NewCategoryData>({
    type: "",
    items: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [itemInput, setItemInput] = useState<string>("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await CategoryApis.getAllCategories();
      if (res.status === 200) {
        setCategories(res.data);
      } else {
        setErrorMessage("Failed to fetch categories.");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setErrorMessage("Error fetching categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setIsEditMode(false);
    setNewCategoryData({ type: "", items: [] });
    setIsModalOpen(true);
    setErrorMessage("");
  };

  const handleOpenEditModal = (category: Category) => {
    setIsEditMode(true);
    setCurrentCategory(category);
    setNewCategoryData({ type: category.type, items: [...category.items] });
    setIsModalOpen(true);
    setErrorMessage("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCategory(null);
    setItemInput("");
    setErrorMessage("");
  };

  const handleAddItem = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && itemInput.trim() !== "") {
      e.preventDefault();
      const updatedItems = [...newCategoryData.items, itemInput.trim()];
      setNewCategoryData((prevData) => ({
        ...prevData,
        items: updatedItems,
      }));
      setItemInput("");
    }
  };

  const handleRemoveItem = (itemToRemove: string) => {
    const updatedItems = newCategoryData.items.filter(
      (item) => item !== itemToRemove
    );
    setNewCategoryData((prevData) => ({
      ...prevData,
      items: updatedItems,
    }));
  };

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      let res;
      if (isEditMode) {
        if (!currentCategory) {
          setErrorMessage("No category selected for editing.");
          setLoading(false);
          return;
        }
        const id = currentCategory._id;
        const data = {
          items: newCategoryData.items,
        };
        res = await CategoryApis.updateCategories(id, data);
      } else {
        if (!newCategoryData.type || newCategoryData.items.length === 0) {
          setErrorMessage("Type and at least one item are required.");
          setLoading(false);
          return;
        }
        res = await CategoryApis.createCategory(newCategoryData);
      }

      if (res.status === 201 || res.status === 200) {
        handleCloseModal();
        fetchCategories();
      } else {
        setErrorMessage("Operation failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during category operation:", error);
      setErrorMessage("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800">
          Categories
        </h1>
        <button
          onClick={handleOpenAddModal}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          Add Category
        </button>
      </header>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <svg
            className="animate-spin h-8 w-8 text-blue-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative my-4"
          role="alert"
        >
          <span className="block sm:inline">{errorMessage}</span>
        </div>
      )}

      {!loading && categories.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <div
              key={category._id}
              className="bg-white rounded-lg shadow-lg p-6 relative border-l-4 border-blue-500"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-700">
                  {category.type}
                </h3>
                <button
                  onClick={() => handleOpenEditModal(category)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Edit category"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
              <ul className="text-gray-600 space-y-2">
                {category.items.length > 0 ? (
                  category.items.map((item, index) => (
                    <li key={index} className="flex items-center">
                      <span className="inline-block h-2 w-2 rounded-full bg-blue-400 mr-2"></span>
                      {item}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400 italic">No items added yet.</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      )}

      {!loading && categories.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg">No categories found. Click &apos;Add Category&apos; to get started!</p>
        </div>
      )}

      {/* Modal for Add/Edit Category */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative p-8 bg-white w-96 max-h-[80vh] overflow-y-auto mx-auto rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">
              {isEditMode ? "Edit Category" : "Add New Category"}
            </h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Category Type
                </label>
                <select
                  disabled={isEditMode}
                  value={newCategoryData.type}
                  onChange={(e) =>
                    setNewCategoryData({
                      ...newCategoryData,
                      type: e.target.value,
                    })
                  }
                  className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${
                    isEditMode ? "bg-gray-200" : ""
                  }`}
                >
                  <option value="" disabled>
                    Select a type
                  </option>
                  <option value="Document Category">Document Category</option>
                  <option value="Raw Material Category">
                    Raw Material Category
                  </option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Items
                </label>
                <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg min-h-[40px]">
                  {newCategoryData.items.map((item, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item)}
                        className="ml-1 text-blue-800 hover:text-blue-900 focus:outline-none"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  onKeyDown={handleAddItem}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  placeholder="Type an item and press Enter"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isEditMode ? "Update Category" : "Add Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryPage;

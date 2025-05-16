'use client';

import React, { useState } from 'react';
import { categories, Category } from '@/lib/categories';

interface CategorySelectorProps {
  onSelect: (categoryId: string) => void;
  selectedCategoryId?: string;
  className?: string;
}

export default function CategorySelector({
  onSelect,
  selectedCategoryId = '',
  className = '',
}: CategorySelectorProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        📂 Select Category
      </label>
      <select
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        value={selectedCategoryId}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">-- Choose Category --</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {selectedCategoryId && (
        <p className="mt-1 text-sm text-gray-500">
          {categories.find(cat => cat.id === selectedCategoryId)?.description}
        </p>
      )}
    </div>
  );
} 
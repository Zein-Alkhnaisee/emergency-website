// src/components/Services/AvailabilityManager.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlus, FaTrash } from 'react-icons/fa';

const DAYS = [
  'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
];

const DAY_LABELS = {
  saturday: 'السبت',
  sunday: 'الأحد',
  monday: 'الإثنين',
  tuesday: 'الثلاثاء',
  wednesday: 'الأربعاء',
  thursday: 'الخميس',
  friday: 'الجمعة',
};

const AvailabilityManager = ({ value = [], onChange }) => {
  const { t } = useTranslation();
  const [slots, setSlots] = useState(value.length ? value : [{ day: 'saturday', from: '09:00', to: '17:00' }]);

  const addSlot = () => {
    setSlots([...slots, { day: 'saturday', from: '09:00', to: '17:00' }]);
  };

  const removeSlot = (index) => {
    const newSlots = slots.filter((_, i) => i !== index);
    setSlots(newSlots);
    onChange(newSlots);
  };

  const updateSlot = (index, field, val) => {
    const newSlots = [...slots];
    newSlots[index][field] = val;
    setSlots(newSlots);
    onChange(newSlots);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('services.availability')}
      </label>

      {slots.map((slot, index) => (
        <div key={index} className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:shadow-md">
          <div className="flex-1 min-w-[120px]">
            <select
              value={slot.day}
              onChange={(e) => updateSlot(index, 'day', e.target.value)}
              className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all duration-200"
            >
              {DAYS.map(day => (
                <option key={day} value={day}>{DAY_LABELS[day]}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[100px]">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('services.from')}</span>
              <input
                type="time"
                value={slot.from}
                onChange={(e) => updateSlot(index, 'from', e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[100px]">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{t('services.to')}</span>
              <input
                type="time"
                value={slot.to}
                onChange={(e) => updateSlot(index, 'to', e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {slots.length > 1 && (
            <button
              type="button"
              onClick={() => removeSlot(index)}
              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <FaTrash />
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addSlot}
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/70 transition-all duration-200 hover:scale-105"
      >
        <FaPlus /> {t('services.addTimeSlot')}
      </button>

      <div className="text-xs text-gray-400 dark:text-gray-500">
        {t('services.availabilityHint')}
      </div>
    </div>
  );
};

export default AvailabilityManager;
// components/Permissions/PermissionToggle.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@headlessui/react'; // Une excellente librairie pour des toggles accessibles

interface PermissionToggleProps {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

export const PermissionToggle: React.FC<PermissionToggleProps> = ({ label, description, enabled, onChange, disabled }) => {
  return (
    <Switch.Group as="div" className="flex items-center justify-between p-3 hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
      <span className="flex-grow flex flex-col mr-4">
        <Switch.Label as="span" className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer">
          {label}
        </Switch.Label>
        <Switch.Description as="span" className="text-xs text-gray-500 dark:text-gray-400">
          {description}
        </Switch.Description>
      </span>
      <Switch
        checked={enabled}
        onChange={onChange}
        disabled={disabled}
        className={`${enabled ? 'bg-teal-600' : 'bg-gray-200 dark:bg-gray-700'}
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 
          focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span
          aria-hidden="true"
          className={`${enabled ? 'translate-x-5' : 'translate-x-0'}
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 
            transition duration-200 ease-in-out`}
        />
      </Switch>
    </Switch.Group>
  );
};
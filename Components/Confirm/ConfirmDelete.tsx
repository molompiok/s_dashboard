import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoAlertCircleOutline } from 'react-icons/io5';

export { ConfirmDelete };

interface ConfirmDeleteProps {
  title: string;
  description?: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  onCancel: () => void;
  onDelete: () => void;
  isDanger?: boolean;
  isLoading?: boolean;
  style?: React.CSSProperties | undefined;
}

function ConfirmDelete({
  title,
  description,
  warningText,
  confirmText,
  cancelText,
  onCancel,
  onDelete,
  isDanger = true,
  isLoading,
  style,
}: ConfirmDeleteProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const finalConfirmText = confirmText || (isDanger ? t('common.delete') : t('common.confirm'));
  const finalCancelText = cancelText || t('common.cancel');

  const confirmButtonClasses = `
    inline-flex cursor-pointer items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition ease-in-out duration-150 flex-1 sm:flex-none sm:w-auto
    ${isDanger
      ? 'bg-red-600 hover:bg-red-700  dark:hover:bg-red-500 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}
  `;

  const cancelButtonClasses = `
    inline-flex items-center  cursor-pointer justify-center rounded-md border border-gray-300 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex-1 sm:flex-none sm:w-auto
  `;

  return (
    <div
      style={style}
      className="confirm-delete w-full  rounded-lg shadow-xl p-4 sm:p-6 text-center"
    >
      {isDanger && (
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <IoAlertCircleOutline className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
      )}

      <div className="mt-3 text-center sm:mt-5">
        <h3 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100" id="modal-title">
          {title}
        </h3>
        {(description || warningText) && (
          <div className="mt-2">
            <p className={`text-sm ${isDanger ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
              {description || warningText}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 sm:mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <button
          type="button"
          className={cancelButtonClasses}
          onClick={onCancel}
          disabled={isLoading ?? loading}
        >
          {finalCancelText}
        </button>
        <button
          type="button"
          className={confirmButtonClasses}
          onClick={() => {
            setLoading(true);
            onDelete();
          }}
          disabled={isLoading ?? loading}
        >
          {(isLoading ?? loading) ? (
            <svg
              className="animate-spin h-4 w-4 text-white"
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
          ) : (
            finalConfirmText
          )}
        </button>
      </div>
    </div>
  );
}

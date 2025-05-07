import { JSX } from "react"
import { IoChevronBack } from "react-icons/io5"

export { Confirm }

function Confirm({
  cancel = 'Retour',
  confirm = 'Sauvegarder',
  iconCancelLeft,
  iconCancelRight,
  iconConfirmRight,
  iconConfirmLeft,
  canConfirm,
  isLoading,
  onCancel,
  onConfirm
}: {
  onCancel?: () => void,
  onConfirm?: () => void,
  canConfirm?: boolean,
  iconCancelLeft?: JSX.Element | null,
  iconCancelRight?: JSX.Element | null,
  iconConfirmLeft?: JSX.Element | null,
  iconConfirmRight?: JSX.Element | null,
  confirm?: string,
  cancel?: string,
  isLoading?: boolean
}) {
  return (
    <div className="w-full flex items-center justify-around py-3 gap-3">
      <div
        className="flex items-center justify-center gap-3 rounded-3xl px-4 py-2 bg-gray-200 cursor-pointer text-center min-w-[100px] hover:opacity-80"
        onClick={onCancel}
      >
        {iconCancelLeft !== null && (iconCancelLeft || <IoChevronBack />)}
        {cancel}
        {iconCancelRight}
      </div>
      <div
        className={`flex items-center justify-center gap-3 rounded-3xl px-4 py-2 cursor-pointer text-center min-w-[100px] transition hover:opacity-80
        ${canConfirm ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-800'}`}
        onClick={onConfirm}
      >
        {iconConfirmLeft}
        {
          isLoading
            ? (
              <svg className={`animate-spin h-4 w-4  text-white`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )
            : confirm
        }
        {iconConfirmRight}
      </div>
    </div>
  );
}
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
  cancel?: string
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
        {confirm}
        {iconConfirmRight}
      </div>
    </div>
  );
}
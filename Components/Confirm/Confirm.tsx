import { JSX } from "react"
import './Confirm.css'
import { IoChevronBack } from "react-icons/io5"

export {Comfirm}


function Comfirm({
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
    return <div className="confirm">
      <div className="cancel" onClick={onCancel}>
        {iconCancelLeft !== null && (iconCancelLeft || <IoChevronBack />)}
        {cancel}
        {iconCancelRight}
      </div>
      <div className={"ok " + (canConfirm ? '' : 'no-confirm')} onClick={onConfirm}>
        {iconConfirmLeft}
        {confirm}
        {iconConfirmRight}</div>
    </div>
  }
  
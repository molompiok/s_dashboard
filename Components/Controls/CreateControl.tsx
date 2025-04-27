import { FaPlusCircle, FaTimesCircle } from "react-icons/fa"

type CreateControlProps = {
  title: string
  onCreate: () => Promise<any> | any | void
  onCancel: () => void
  isLoading?: boolean
  canCreate?:boolean
  t: (key: string, options?: any) => string
}

/**
 * Composant pour gérer la création d'un produit, catégorie, etc.
 * @param {object} props
 * @param {string} props.title - Titre à afficher (ex: "Créer une nouvelle catégorie").
 * @param {function(): Promise<void>} props.onCreate - Fonction appelée pour créer.
 * @param {function(): void} props.onCancel - Fonction appelée pour annuler la création.
 * @param {boolean} [props.isLoading] - Désactive les boutons pendant une opération.
 * @param {function(string): string} props.t - Fonction de traduction.
 */
export function CreateControl({
  title,
  onCreate,
  onCancel,
  isLoading = false,
  canCreate,
  t,
}: CreateControlProps) {

  const handleCreateClick = async () => {
    await onCreate();
  }

  const handleCancelClick = () => {
    onCancel();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Titre */}
      <span className="text-base font-medium text-gray-800">{title}</span>

      {/* Groupe de boutons */}
      <div className="flex items-center gap-3">
        {/* Bouton Créer */}
        <button
          type="button"
          onClick={handleCreateClick}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition disabled:opacity-50 disabled:cursor-not-allowed ${
            canCreate 
              ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100 focus:ring-2 focus:ring-green-400 focus:ring-opacity-50' 
              : 'bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50'
          }`}
          aria-label={t('common.create')}
        >
          <FaPlusCircle size={14} />
          <span>{canCreate?t('common.create'):t('common.verify')}</span>
        </button>

        {/* Bouton Annuler */}
        <button
          type="button"
          onClick={handleCancelClick}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border transition bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label={t('common.cancel')}
        >
          <FaTimesCircle size={14} />
          <span>{t('common.cancel')}</span>
        </button>
      </div>
    </div>
  )
}

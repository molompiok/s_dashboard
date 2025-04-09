import React from 'react';
import { IoPersonCircleOutline } from 'react-icons/io5'; // Icône par défaut
import { useStore } from '../../pages/stores/StoreStore';
import './userPreview.css'
interface UserInterface {
    id: string;
    full_name: string;
    email?: string;
    photos?: string[];
    created_at?: string;
    bio?: string;
    [key: string]: any;
}

interface UserPreviewProps {
    user: Partial<UserInterface>;
}

const UserPreview: React.FC<UserPreviewProps> = ({ user }) => {
    const { currentStore } = useStore()
    
    return (
        <div className="user-preview">
            <div className="user-preview-header">
                {/* Avatar de l'utilisateur */}
                {user.photo && user.photo.length > 0 ? (
                    <img
                        src={user.photo[0]?.startsWith('/')? `${currentStore?.url||''}${user.photo[0]}`: user.photo[0]}
                        alt={`${user.full_name}'s avatar`}
                        className="user-avatar"
                    />
                ) : (
                    <IoPersonCircleOutline className="user-avatar-default" />
                )}
                
                {/* Nom et informations principales */}
                <div className="user-info">
                    <h2 className="user-name">{user.full_name || 'Utilisateur inconnu'}</h2>
                    {user.email && (
                        <p className="user-email">{user.email}</p>
                    )}
                    {user.created_at && (
                        <p className="user-joined">
                            Inscrit le {new Date(user.created_at).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Bio si disponible */}
            {user.bio && (
                <div className="user-bio">
                    <h3>Bio</h3>
                    <p>{user.bio}</p>
                </div>
            )}
        </div>
    );
};

export default UserPreview;


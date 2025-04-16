
import { useState } from 'react';
import './i.css'

export function Page() {
  

  return <div className="App">
<SearchBar />
      <StoreList />
      <StoreInfo />
      <SalesPoints />
      <ThemeSection />
      <AddStore />
</div>
}


function SalesPoints() {
  const [salesPoints, setSalesPoints] = useState([
    { name: 'Point de vente 1', address: '123 Rue Exemple, Paris' },
    { name: 'Point de vente 2', address: '456 Avenue Test, Lyon' },
    { name: 'Point de vente 3', address: '789 Boulevard Demo, Marseille' },
  ]);
  const [newPointName, setNewPointName] = useState('');
  const [newPointAddress, setNewPointAddress] = useState('');

  const handleAddSalesPoint = (e:any) => {
    e.preventDefault();
    if (newPointName && newPointAddress) {
      setSalesPoints([...salesPoints, { name: newPointName, address: newPointAddress }]);
      setNewPointName('');
      setNewPointAddress('');
    }
  };

  return (
    <div className="sales-points">
      <h2>Points de Vente</h2>
      <div className="sales-points-list">
        {salesPoints.map((point, index) => (
          <div key={index} className="sales-point-card">
            <h3>{point.name}</h3>
            <p>{point.address}</p>
          </div>
        ))}
      </div>
      <button className="see-more-btn">Voir plus</button>
      <div className="add-sales-point">
        <h3>Ajouter un Point de Vente</h3>
        <form onSubmit={handleAddSalesPoint}>
          <input
            type="text"
            placeholder="Nom du point de vente"
            value={newPointName}
            onChange={(e) => setNewPointName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Adresse"
            value={newPointAddress}
            onChange={(e) => setNewPointAddress(e.target.value)}
            required
          />
          <button type="submit" className="add-btn">Ajouter</button>
        </form>
      </div>
    </div>
  );
}

// src/components/SearchBar.js
function SearchBar() {
  return (
    <div className="search-bar">
      <div className="filters">
        <button className="filter-btn">Inactif</button>
        <button className="filter-btn active">Actif</button>
        <button className="filter-btn">Store courant</button>
      </div>
      <div className="search-input">
        <input type="text" placeholder="Recherche par nom" />
        <button className="view-all-btn">Voir tout &gt;</button>
      </div>
    </div>
  );
}

// src/components/StoreList.js

function StoreList() {
  const stores = [
    { name: 'Store 1', description: 'Lorem ipsum dolor...', icon: '🛒' },
    { name: 'Store 2', description: 'Consectetur adipiscing...', icon: '🏬' },
    { name: 'Store 3', description: 'Sit amet consectetur...', icon: '🛍️' },
  ];

  return (
    <div className="store-list">
      {stores.map((store, index) => (
        <div key={index} className="store-card">
          <div className="store-icon">{store.icon}</div>
          <h3>{store.name}</h3>
          <p>{store.description}</p>
        </div>
      ))}
    </div>
  );
}


function StoreInfo() {
  return (
    <div className="store-info">
      <div className="store-actions">
        <button className="action-btn primary">Modifier</button>
        <button className="action-btn">Paramètres</button>
        <button className="action-btn">Stopper</button>
      </div>
      <div className="stats-card">
        <h2>Statistiques</h2>
        <div className="stats-item">
          <span>Commandes</span>
          <span className="stats-value">38</span>
        </div>
        <div className="stats-item">
          <span>Visites</span>
          <span className="stats-value">38</span>
        </div>
        <div className="stats-item">
          <span>Points de ventes</span>
          <span className="stats-value">20/99</span>
        </div>
        <div className="stats-item">
          <span>Collaborateurs</span>
          <span className="stats-value">2/10</span>
        </div>
        <div className="stats-item">
          <span>Pays</span>
          <span className="stats-value">2/10</span>
        </div>
        <div className="stats-item">
          <span>Disque SSD</span>
          <span className="stats-value">2/10 GB</span>
        </div>
      </div>
    </div>
  );
}


function ThemeSection() {
  const recentThemes = [
    { name: 'Thème 1', price: '12 300F', isFree: true },
    { name: 'Thème 2', price: '12 300F', isFree: false },
    { name: 'Thème 3', price: '12 300F', isFree: true },
  ];

  return (
    <div className="theme-section">
      <div className="current-theme">
        <div className="theme-image-placeholder"></div>
        <div className="theme-info">
          <div className="theme-header">
            <h2>Theme Nane Sublymus</h2>
            <button className="change-theme-btn">Changer de thème</button>
          </div>
          <p>multi category 3D AR 3D seulement food immobilier</p>
          <span className="status-badge">ACTIF</span>
          <div className="theme-options">
            <button className="option-btn">Color</button>
            <button className="option-btn">Text</button>
            <button className="option-btn">Disposition</button>
            <button className="option-btn">Pub</button>
            <button className="option-btn">FAQ</button>
            <button className="option-btn">Blog</button>
          </div>
        </div>
      </div>
      <div className="recent-themes">
        <h2>Liste des Thèmes Récemment Utilisés</h2>
        <div className="themes-list">
          {recentThemes.map((theme, index) => (
            <div key={index} className="theme-card">
              <div className="theme-placeholder"></div>
              <p>{theme.name}</p>
              <div className="theme-footer">
                <span className="theme-price">{theme.price}</span>
                {theme.isFree && <span className="free-badge">Gratuit</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddStore() {
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreDescription, setNewStoreDescription] = useState('');

  const handleAddStore = (e:any) => {
    e.preventDefault();
    if (newStoreName && newStoreDescription) {
      // Ici, vous pouvez ajouter une logique pour envoyer les données à une API
      console.log('Nouvelle boutique ajoutée :', { name: newStoreName, description: newStoreDescription });
      setNewStoreName('');
      setNewStoreDescription('');
    }
  };

  return (
    <div className="add-store">
      <h2>Ajouter une Boutique</h2>
      <form onSubmit={handleAddStore}>
        <input
          type="text"
          placeholder="Nom de la boutique"
          value={newStoreName}
          onChange={(e) => setNewStoreName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={newStoreDescription}
          onChange={(e) => setNewStoreDescription(e.target.value)}
          required
        />
        <button type="submit" className="add-btn">Ajouter</button>
      </form>
    </div>
  );
}
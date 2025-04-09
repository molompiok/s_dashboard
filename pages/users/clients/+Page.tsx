import { ClientList } from "../../../Components/ClientList/ClientList"


export {Page}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import './+Page.css';
import { UserInterface } from "../../../Interfaces/Interfaces";
import { useClientStore } from "./ClientStore";
import { useStore } from "../../stores/StoreStore";
import { getImg } from "../../../Components/Utils/StringFormater";
import { Topbar } from "../../../Components/TopBar/TopBar";

const Page: React.FC = () => {
  // États pour les filtres, la recherche, le tri et les données
  const { fetchClients } = useClientStore();
  const { currentStore } = useStore()
  const [clients, setClients] = useState<(Partial<UserInterface>)[]>([]);
  const [filteredClients, setFilteredClients] = useState<(Partial<UserInterface>)[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('date-desc');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  // Couleurs pour les différents statuts
  const statusColors: { [key: string]: string } = {
    CLIENT: '#a3bffa',
    NEW: '#f3a5b1',
    PREMIUM: '#f6d365',
  };

  // Charger les clients depuis l'API (simulé ici)
  const loadClients = async (pageNum: number, reset: boolean = false) => {
    try {
      const clients = await fetchClients({}) 
      if(!clients?.list) return 

      setClients((prev) => (reset ? clients.list : [...prev, ...clients.list]));
      console.log(clients?.list);
      
      setHasMore(clients?.list.length === 10); // Simuler la fin des données
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      setHasMore(false);
    }
  };

  // Charger les clients initiaux
  useEffect(() => {
    currentStore && loadClients(1, true);
  }, [currentStore]);

  // Filtrer et trier les clients
  useEffect(() => {
    let filtered = [...clients];

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (client) =>
          client.full_name?.toLowerCase().includes(query) ||
          client.id?.toString().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phone?.toLowerCase().includes(query)
      );
    }

    // Filtrer par statut
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter((client) => client.status === statusFilter);
    }

    // Filtrer par date
    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      filtered = filtered.filter((client) => {
        const clientDate = new Date(client.created_at||'');
        return (
          clientDate.getFullYear() === selectedDate.getFullYear() &&
          clientDate.getMonth() === selectedDate.getMonth() &&
          clientDate.getDate() === selectedDate.getDate()
        );
      });
    }

    // Trier
    if (orderBy === 'date-asc') {
      filtered.sort((a, b) => new Date(a.created_at||'').getTime() - new Date(b.created_at||'').getTime());
    } else if (orderBy === 'date-desc') {
      filtered.sort((a, b) => new Date(b.created_at||'').getTime() - new Date(a.created_at||'').getTime());
    } else if (orderBy === 'full_name-asc') {
      filtered.sort((a, b) => a.full_name?.localeCompare(b.full_name||'')||0);
    } else if (orderBy === 'full_name-desc') {
      filtered.sort((a, b) => b.full_name?.localeCompare(a.full_name||'')||0);
    }

    setFilteredClients(filtered);
  }, [clients, searchQuery, statusFilter, dateFilter, orderBy]);

  // Charger plus de clients lors du scroll
  const loadMoreClients = () => {
    setPage((prev) => prev + 1);
    fetchClients({});
  };

  return (
    <div className="clients-page">
      <Topbar />
      <ClientList/>
      
    </div>
  );
};
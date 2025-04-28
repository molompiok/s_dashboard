//pages/users/clients/+Page.tsx
import { ClientList } from "../../../Components/ClientList/ClientList"


export {Page}

import React from 'react';
import './+Page.css';
import { Topbar } from "../../../Components/TopBar/TopBar";

const Page: React.FC = () => {

  return (
    <div className="clients-page">
      <Topbar />
      <ClientList/>
    </div>
  );
};
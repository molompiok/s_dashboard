export { Layout }

import React from 'react'
import logoUrl from './logo.svg'
import { PageContextProvider, usePageContext } from './usePageContext'
import { Link } from './Link'
import type { PageContext } from 'vike/types'
import './css/index.css'
import './Layout.css'
import { useApp } from './Stores/UseApp'
import { Icons } from '../Components/Utils/constants'

function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Frame >
          <Sidebar>
            <Logo />
            <Link href="/" activeIcon={Icons.home} defaultIcon={Icons.home_outline}>Accueil</Link>
            <Link href="/products" activeIcon={Icons.products} defaultIcon={Icons.products_outline}>Produits</Link>
            <Link href="/stores" activeIcon={Icons.stores} defaultIcon={Icons.stores_outline}>Boutiques</Link>
            <Link href="/teams" activeIcon={Icons.teams} defaultIcon={Icons.teams_outline}>Equipes</Link>
            <Link href="/stats" activeIcon={Icons.stats} defaultIcon={Icons.stats_outline}>Statistique</Link>
            <Link href="/commands" activeIcon={Icons.commands} defaultIcon={Icons.commands_outline}>Commandes</Link>
          </Sidebar>
          <Content>{children}</Content>
        </Frame>
        <Bottombar>
          <Link href="/" activeIcon={Icons.home} defaultIcon={Icons.home_outline} />
          <Link href="/products" activeIcon={Icons.products} defaultIcon={Icons.products_outline} />
          <Link href="/stores" activeIcon={Icons.stores} defaultIcon={Icons.stores_outline} />
          <Link href="/teams" activeIcon={Icons.teams} defaultIcon={Icons.teams_outline} />
        </Bottombar>
        <OpenChild />
      </PageContextProvider>
    </React.StrictMode>
  )
}

function OpenChild() {
  const { currentChild, alignItems, background, justifyContent, openChild } = useApp();
  const child = currentChild || null
  const {urlOriginal} = usePageContext()
  console.log({urlOriginal});
  
  return (child) && 
    <div id='open-child' style={{
      alignItems, background, justifyContent
    }} onClick={(e) => {
      if (e.currentTarget == e.target) {
        openChild(null)
      }
    }}>{child}</div>
}

function Frame({ children }: { children: React.ReactNode }) {
  const { blur } = useApp();
  return (
    <div
      style={{
        display: 'flex',
        maxWidth: 900,
        margin: 'auto',
        filter: blur ? `blur(${blur}px)` : ''
      }}
    >
      {children}
    </div>
  )
}

function Row({ children, style, id, className }: { id?: string, className?: string, style?: React.CSSProperties | undefined, children: React.ReactNode }) {
  return (
    <div className={`row ${className}`} id={id} style={style}>
      {children}
    </div>
  )
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div
      id="sidebar"
      style={{
        padding: 20,
        flexShrink: 0,
        flexDirection: 'column',
        lineHeight: '1.8em',
        borderRight: '2px solid #eee'
      }}
    >
      {children}
    </div>
  )
}
function Bottombar({ children }: { children: React.ReactNode }) {
  const { blur } = useApp();
  return (
    <div id="bottombar" style={{ filter: blur ? `blur(10px)` : '' }} >
      {children}
    </div>
  )
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div id="page">
      {children}
    </div>
  )
}



function Content({ children }: { children: React.ReactNode }) {
  return (
    <div
    id="page-container"
    style={{
      maxHeight: '100vh',
      maxWidth: '100%',
      overflowX:'hidden',
      overflowY:'auto',
      width:'calc(100% - var(--side-bar))'
    }}
  >
    <div
    id="page-content"
    style={{
      padding: 20,
      width: '100%',
      paddingBottom:'200px',
    }}
  >
    <div className="corrige-le-bug-content-overflow-x" style={{width:'1200px'}}></div>
    {children}
  </div>
  </div>
  )
}

function Logo() {
  return (
    <div
      style={{
        marginTop: 20,
        marginBottom: 10,
        display: 'inline-block'
      }}
    >
      <a href="/">
        <img src={logoUrl} height={64} width={64} alt="logo" />
      </a>
    </div>
  )
}


/*
 interface BiSolidLayout BiLayout
 images 
*/
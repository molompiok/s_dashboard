export { Layout }

import React from 'react'
import logoUrl from './logo.svg'
import { PageContextProvider } from './usePageContext'
import { Link } from './Link'
import type { PageContext } from 'vike/types'
import './css/index.css'
import './Layout.css'
import { useApp } from './Stores/UseApp'

function Layout({ children, pageContext }: { children: React.ReactNode; pageContext: PageContext }) {
  const {currentChild,alignItems,background,blur,justifyContent} = useApp();
  return (
    <React.StrictMode>
      <PageContextProvider pageContext={pageContext}>
        <Frame >
          <Sidebar>
            <Logo />
            <Link href="/">Accueille</Link>
            <Link href="/products">Produits</Link>
            <Link href="/stores">Boutiques</Link>
            <Link href="/teams">Equipes</Link>
            <Link href="/stats">Statistique</Link>
            <Link href="/commands">Commandes</Link>
          </Sidebar>
          <Content>{children}</Content>
        </Frame>
        <Bottombar>
            <Link href="/">Accueille</Link>
            <Link href="/products">Produits</Link>
            <Link href="/stores">Boutiques</Link>
            <Link href="/teams">Equipes</Link>
        </Bottombar>
        <OpenChild/> 
      </PageContextProvider>
    </React.StrictMode>
  )
}

function OpenChild(){
  const {currentChild,alignItems,background,justifyContent, openChild} = useApp();
   const child = currentChild||null
   console.log({child});
   
  return (child) && <div id="open-child">
    <div id='viewer-ctn' style={{
      alignItems,background,justifyContent
    }} onClick={(e)=>{
      if(e.currentTarget == e.target){
        openChild(null)
      }
    }}>{child}</div>
  </div>
}

function Frame({ children }: { children: React.ReactNode }) {
  const {blur} = useApp();
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

function Row({ children, style , id, className}: {id?:string,className?:string,style?:React.CSSProperties | undefined, children: React.ReactNode }) {
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
  const {blur} = useApp();
  return (
    <div id="bottombar" style={{ filter: blur ? `blur(10px)` : ''}} >
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
    <div id="page-container">
      <div
        id="page-content"
        style={{
          padding: 20,
          paddingBottom: 50,
          minHeight: '100vh',
          height:'100%'
        }}
      >
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
 interface BiSolidLayout
 images 
*/
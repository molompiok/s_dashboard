import './index.css';
import { Topbar } from './TopBar';
import { HomeStat } from './HomeStat/HomeStat';
import { HomeManage } from './HomeManage/HomeManage';
import { CommandeList } from '../../Components/Commandes/CommandesList';
import { usePageContext } from '../../renderer/usePageContext';
export { Page }
function Page() {
  
  const {urlParsed:{search}} = usePageContext()
  console.log(search);


  return (
    <div className='home-page'>
      <Topbar />
      <div className='content'>
        <HomeStat />
        <HomeManage/>
        <CommandeList/>
      </div>
    </div>
  )
}
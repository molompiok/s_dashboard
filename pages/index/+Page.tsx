import './index.css';
import { Topbar } from './TopBar';
import { HomeStat } from '../Components/HomeStat/HomeStat';
export { Page }
function Page() {
  return (
    <div className='home-page'>
      <Topbar />
      <div className='content'>
        <HomeStat />
      </div>
    </div>
  )
}
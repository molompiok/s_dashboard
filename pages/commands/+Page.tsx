import { CommandeList } from '../../Components/CommandesList/CommandesList'
import { Topbar } from '../../Components/TopBar/TopBar'
import './Page.css'

export { Page }

function Page() {
  return (
    <div className="commands">
      <Topbar/>
      <CommandeList/>
    </div>
  )
}

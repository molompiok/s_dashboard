import './Progress.css'

export {Progrees}

function Progrees({progress}:{progress:number}) {
  
  return <div className="progress">
    <div className="bar" style={{width:`${100*progress}%`}}></div>
  </div>
}
import './Progress.css'

export {Progrees}

function Progrees({progress,color}:{color?:string,progress:number}) {
  
  return <div className={`${color}`}>
    <div className="bar" style={{width:`${100*progress}%`}}></div>
  </div>
}
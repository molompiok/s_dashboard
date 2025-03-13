import { IoStar, IoStarHalf, IoStarOutline } from 'react-icons/io5'
import './Stars.css'

export { Stars }
function Stars({ rating }: { rating: number }) {


    return <div className="stars">
        {
            Array.from({ length: Math.floor(rating) }).map((_, i) => <IoStar />)
        }
        {
            Math.ceil(rating - Math.trunc(rating)) != 0 && <IoStarHalf />
        }
        {
            Array.from({ length: Math.floor(5 - rating) }).map((_, i) => <IoStarOutline />)
        }
    </div>
}
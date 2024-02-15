
import "./Event.scss"

function Event({data, children, ...rest}) {
        console.log(data);
    return (
        <div {...rest}>
            {children}
        </div>
    )
}


export default Event

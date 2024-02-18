import {forwardRef, useEffect, useImperativeHandle, useRef, useState} from "react";

import "./Spinner.scss"

export const InfiniteScroll =  forwardRef(({spinner,count, localKey, refreshTime, children, renderItem, fetch, ...rest}, ref) => {
    const anchorRef = useRef(null)
    const [page, setPage] = useState(1);
    const [items, setItems] = useState([]);
    const [isPending, setIsPending] = useState(false);
    const [ended, setEnded] = useState(false);

    const reset = ()=>{
        setPage(1);
        setItems([]);
        setEnded(false);
        setIsPending(false);
    };

    useEffect(() => {
        if( localKey ){
            const p = items.length<= count ? Math.floor(items.length/count)+1 : Math.ceil(items.length / count)+1;
            console.log("page key", p);
            setPage(p);
        }
    }, [localKey])

    useImperativeHandle(ref, () => ({
        // Expose parent function to parent component
        reset,
        setItems: (items) => {
            setItems(items)
        }
    }));

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && !ended ) {
                    setIsPending(true);
                    fetch?.(page).then(data => {
                        if( data.length < count ){
                            setEnded(true);
                        }
                        setPage(p => p + 1);
                        setItems(lastItems => {
                            const newItems = [...lastItems, ...data];
                            if( localKey )
                               localStorage.setItem(localKey, JSON.stringify(newItems));
                            return newItems;
                        });
                    }).finally(() => {
                        setIsPending(false);
                    });
                }
            },
            { threshold: 1 }
        );

        if (anchorRef.current) {
            observer.observe(anchorRef.current);
        }

        return () => {
            if (anchorRef.current) {
                observer.unobserve(anchorRef.current);
            }
        };
    }, [anchorRef, page, refreshTime, fetch]);

    return <div className={"infinite-scroll"}>
        <div {...rest}>
            {(items || []).map(i => renderItem(i))}
        </div>
        <div className="anchor-bottom" ref={anchorRef}></div>
        {isPending && spinner}
    </div>
});
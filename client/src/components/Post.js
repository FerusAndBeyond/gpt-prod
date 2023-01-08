import React, { useState } from "react"
import Item from "./Item"

function getYoutubeId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function getURL(link) {
    let url = null;
    if (link) {
        const id = getYoutubeId(link)
        url = !id ? link : `https://www.youtube.com/embed/${id}`
    }
    return url
}

export default function Post({ description, link, onChange }) {
    let [url, setUrl] = useState(getURL(link))

    return <Item
        onChange={onChange}
        middle={
            <>
                {description}
                {url ?
                    <>
                        <hr />
                        <iframe
                            width="100%"
                            height="500px"
                            src={url}
                            frameborder="0"
                            allowfullscreen
                        />
                    </>
                    : null}
            </>
        }
    />
}
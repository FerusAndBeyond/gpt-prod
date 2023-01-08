import React from "react"
import Item from "./Item"

export default function Reminder({ description, onChange }) {
    return <Item
        onChange={onChange}
        middle={description}
    />
}
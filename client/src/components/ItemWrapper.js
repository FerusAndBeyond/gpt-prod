import React from "react"
import Post from "./Post"
import Todo from "./Todo"
import Reminder from "./Reminder"

const ITEMS = {
    post: Post,
    todo: Todo,
    reminder: Reminder
}

export default function ItemWrapper({ id, type, onChange, ...props }) {
    const Item = ITEMS[type]
    if (!Item)
        return
    return <Item {...props} onChange={(...args) => onChange(id, ...args)} />
}

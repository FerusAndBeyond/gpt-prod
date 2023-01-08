import React from "react"
import Item from "./Item"
import { IconButton } from "@mui/material"
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

export default function Todo({ id, description, onChange, finished }) {
    return <Item
        className={(finished !== null ? "todo-finished" : "")}
        onChange={onChange}
        left={<IconButton onClick={() => onChange("patch", { finished: !finished ? new Date() : null })}>
            {finished ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
        </IconButton>}
        middle={description}
    />
}
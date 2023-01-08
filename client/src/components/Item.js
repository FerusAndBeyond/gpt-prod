import React from "react"
import { IconButton } from "@mui/material"
import DeleteIcon from "@mui/icons-material/Delete"

export default function Item({ className, left, middle, right, onChange }) {
    return <div className={"item-container" + (!className ? "" : " " + className)}>
        <div className="item">
            <div className="item-body">
                <div className="item-left">
                    {left}
                </div>
                <div className="item-middle">
                    {middle}
                </div>
                <div className="item-right">
                    {right}
                </div>
                <IconButton style={{ marginLeft: "auto" }} onClick={() => onChange("delete")}>
                    <DeleteIcon />
                </IconButton>
            </div>
        </div>
    </div>
}
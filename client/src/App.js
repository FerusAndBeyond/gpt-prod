import React, { Component, useState, useEffect } from "react"
import axios from "axios"
import { TextField } from "@mui/material"
import { Button } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import PushPinIcon from '@mui/icons-material/PushPin';
import ItemWrapper from "./components/ItemWrapper";

const SWITCH_STICKY_ITEM_EVERY = 5000

let api = axios.create({
    baseURL: "http://localhost:8000"
});

const getMinutesSinceEpoch = () => Math.floor(new Date().getTime() / (SWITCH_STICKY_ITEM_EVERY))
function StickyItems({ items, onChange, onDelete }) {
    const [minuteSinceEpoch, setMinuteSinceEpoch] = useState(getMinutesSinceEpoch());

    useEffect(() => {
        // update every minute
        const interval = setInterval(() => setMinuteSinceEpoch(getMinutesSinceEpoch()), SWITCH_STICKY_ITEM_EVERY);
        return () => {
            clearInterval(interval);
        };
    }, []);

    if (items.length === 0)
        return null

    // show one at the time, change every SWITCH_STICKY_ITEM_EVERY, circulating
    return <div>
        <PushPinIcon style={{ margin: "0.5em" }} />
        {items
            .filter((_, i) => minuteSinceEpoch % items.length === i)
            .map(x => <ItemWrapper {...x} onDelete={onDelete} onChange={onChange} />)
        }
    </div>
}

class App extends Component {
    updateCalled = false

    constructor() {
        super()

        this.state = {
            notes: "",
            items: [],
            inputFocus: false,
            loading: false,
            summary: null
        }

        this.submitNotes = this.submitNotes.bind(this)
        this.getItems = this.getItems.bind(this)
        this.keydown = this.keydown.bind(this);
        this.onChange = this.onChange.bind(this)
        this.notesRef = React.createRef();
        this.summarize = this.summarize.bind(this)

        document.onkeydown = this.keydown
    }

    componentDidMount() {
        this.getItems()
    }

    keydown(e) {
        if (e.shiftKey && e.keyCode === 13) {
            e.preventDefault()
            if (!this.updateCalled) {
                if (document.activeElement === this.notesRef.current) {
                    this.submitNotes()
                }
                this.updateCalled = true
            }
        } else {
            this.updateCalled = false
        }
    }

    async submitNotes() {
        const { notes } = this.state
        this.setState({ loading: true })
        const response = await api.post("/notes", { text: notes })
        this.setState({ items: response.data, notes: "", loading: false })
    }

    async summarize() {
        this.setState({ loading: true })
        const response = await api.get("/summarize")
        this.setState({ summary: response.data, loading: false })
    }

    async getItems() {
        this.setState({ loading: true })
        const response = await api.get("/item")
        this.setState({
            items: response.data,
            loading: false
        })
    }

    // onChange method to pass down to the item-children
    async onChange(id, operation, data) {
        let { items } = this.state;
        let res;
        switch (operation) {
            case "patch":
                res = await api.patch(`/item/${id}`, data)
                if (res.status === 200) {
                    items = items.map(x => {
                        if (x.id === id) {
                            x = { ...x, ...data }
                        }
                        return x
                    })
                }
                break
            case "delete":
                res = await api.delete(`/item/${id}`)
                if (res.status === 200) {
                    items = items.filter(x => {
                        return x.id !== id
                    })
                }
                break
        }
        this.setState({ items })
    }

    render() {
        const { notes, items: allItems, inputFocus, loading, summary } = this.state

        console.log(allItems)

        // extract reminders and set as sticky
        const stickyItems = allItems.filter(x => x.type === "reminder")
        const stickyIds = new Set(stickyItems.map(x => x.id))
        // remove sticky from all
        const items = allItems.filter(x => !stickyIds.has(x.id))

        return (
            <div className="content">
                <h1 style={{ textAlign: "center" }}>GPT-Powered Productivity System</h1>
                <h3>Add</h3>
                {loading ?
                    <LinearProgress /> :
                    <div>
                        <TextField
                            inputRef={this.notesRef}
                            style={{ width: "100%" }}
                            rows={!inputFocus ? 1 : 10}
                            placeholder="What's on your mind?"
                            className="input-animation"
                            multiline
                            onFocus={() => this.setState({ inputFocus: true })}
                            onBlur={() => this.setState({ inputFocus: false })}
                            value={notes}
                            onChange={e => this.setState({ notes: e.target.value })}
                        />
                    </div>
                }
                <br />
                {allItems.length > 0 ? <div style={{ textAlign: "center" }}>
                    <Button onClick={this.summarize} variant="contained">Summarize</Button>
                </div> : null}
                {!summary ? null : <p>{summary}</p>}
                <br />
                <StickyItems items={stickyItems} onChange={this.onChange} />
                <hr />
                {items.map((x, i) => <ItemWrapper onChange={this.onChange} onDelete={this.onDelete} key={"item_" + i} {...x} />)}
            </div>
        )
    }
}

export default App;

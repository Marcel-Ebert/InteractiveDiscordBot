import Grid from "@material-ui/core/Grid"
import Paper from "@material-ui/core/Paper"
import { makeStyles } from "@material-ui/core/styles"
import clsx from "clsx"
import React from "react"
import PlayerArea from "../components/Player/PlayerArea"
import MusicCollectionArea from "../components/MusicCollection/MusicCollectionArea"
import SearchArea from "../components/SearchArea/SearchArea"
import QueueTab from "../components/MusicCollection/Tab/QueueTab"

const useStyles = makeStyles(theme => ({
  paper: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  fixedHeight: {
    maxHeight: "90vh",
    minHeight: "80vh"
  }
}))

function MusicLibraryPage() {
  const classes = useStyles()

  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight)

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} lg={6}>
        <Paper className={fixedHeightPaper}>
          <MusicCollectionArea />
        </Paper>
      </Grid>
      <Grid item xs={12} lg={6}>
        <Paper className={classes.paper}>
          <QueueTab />
        </Paper>
      </Grid>
    </Grid>
  )
}

export default MusicLibraryPage

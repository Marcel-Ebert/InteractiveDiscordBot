import React from "react"
import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import Tooltip from "@material-ui/core/Tooltip"
import ClearIcon from "@material-ui/icons/Clear"
import ShuffleIcon from "@material-ui/icons/Shuffle"
import QueueList from "../List/QueueList"
import { useSelector, useDispatch } from "react-redux"
import { RootState } from "../../../app/rootReducer"
import { AppDispatch } from "../../../app/store"
import { clearTracks, shuffleTracks } from "../../../redux/playerSlice"

interface QueueHeaderProps {
  onClearClick: () => void
  onShuffleClick: () => void
}

function QueueHeader(props: QueueHeaderProps) {
  const { onClearClick, onShuffleClick } = props

  return (
    <Box display="flex">
      <Tooltip arrow placement="top" title="Clear">
        <Button
          variant="contained"
          color="secondary"
          onClick={onClearClick}
          startIcon={<ClearIcon />}
          style={{ margin: 16 }}
        >
          Clear
        </Button>
      </Tooltip>
      <Tooltip arrow placement="top" title="Shuffle">
        <Button
          variant="contained"
          color="secondary"
          onClick={onShuffleClick}
          startIcon={<ShuffleIcon />}
          style={{ margin: 16 }}
        >
          Shuffle
        </Button>
      </Tooltip>
    </Box>
  )
}

interface QueueTabProps {}

function QueueTab(props: QueueTabProps) {
  const dispatch: AppDispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.user)
  const { queue } = useSelector((state: RootState) => state.player)

  const shuffle = React.useCallback(() => {
    if (user) {
      dispatch(shuffleTracks())
    }
  }, [dispatch, user])

  const clear = React.useCallback(() => {
    if (user) {
      dispatch(clearTracks())
    }
  }, [dispatch, user])

  return (
    <>
      {queue.length > 0 && <QueueHeader onClearClick={clear} onShuffleClick={shuffle} />}
      <QueueList />
    </>
  )
}

export default QueueTab

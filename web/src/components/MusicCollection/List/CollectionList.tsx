import React from "react"
import List from "@material-ui/core/List"
import { TrackItem } from "../Item/TrackItem"
import PlaylistItem from "../Item/PlaylistItem"
import { makeStyles } from "@material-ui/core/styles"
import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import Divider from "@material-ui/core/Divider"
import ArrowBackIcon from "@material-ui/icons/ArrowBack"
import PlayIcon from "@material-ui/icons/PlayArrow"
import RefreshIcon from "@material-ui/icons/Cached"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch } from "../../../app/store"
import { playPlaylist, fetchPlaylistByID } from "../../../redux/playlistsSlice"
import { playTrack } from "../../../redux/tracksSlice"
import { RootState } from "../../../app/rootReducer"
import { NotificationsContext } from "../../../context/notifications"

function isTrack(item: MusicItem): item is TrackModel {
  return (item as TrackModel).title !== undefined
}

function isPlaylist(item: MusicItem): item is PlaylistModel {
  return (item as PlaylistModel).name !== undefined
}

const useStyles = makeStyles({
  root: {
    padding: 16,
    paddingTop: 8
  }
})

interface PlaylistHeaderProps {
  onBack?: () => void
  onEnqueueAll?: () => void
  onRefresh?: () => void
}

function PlaylistHeader(props: PlaylistHeaderProps) {
  const { onBack, onEnqueueAll, onRefresh } = props

  return (
    <Box display="flex">
      {onBack && (
        <Button
          variant="contained"
          color="secondary"
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
          style={{ margin: 16 }}
        >
          Go Back
        </Button>
      )}
      {onEnqueueAll && (
        <Button
          variant="contained"
          color="secondary"
          onClick={onEnqueueAll}
          startIcon={<PlayIcon />}
          style={{ margin: 16 }}
        >
          Enqueue All
        </Button>
      )}
      {onRefresh && (
        <Button
          variant="contained"
          color="secondary"
          onClick={onRefresh}
          startIcon={<RefreshIcon />}
          style={{ margin: 16 }}
        >
          Refresh
        </Button>
      )}
    </Box>
  )
}

interface MusicItemListProps {
  items: MusicItem[]
  onTrackSelect: (track: TrackModel) => void
  onPlaylistSelect: (playlist: PlaylistModel) => void
}

const MusicItemList = React.memo(function MusicItemList(props: MusicItemListProps) {
  const { items, onPlaylistSelect, onTrackSelect } = props
  const classes = useStyles()

  const collectionItems = React.useMemo(
    () =>
      items.map((item, index) => {
        if (isTrack(item)) {
          return (
            <>
              {index > 0 && <Divider variant="inset" component="li" />}
              <TrackItem key={item.id} track={item} onClick={() => onTrackSelect(item)} showFavourite />
            </>
          )
        } else if (isPlaylist(item)) {
          return (
            <>
              {index > 0 && <Divider variant="inset" component="li" />}
              <PlaylistItem key={item.id} onClick={() => onPlaylistSelect(item)} playlist={item} showFavourite />
            </>
          )
        } else {
          throw Error(`Unknown item ${JSON.stringify(item)}`)
        }
      }),
    [items, onPlaylistSelect, onTrackSelect]
  )

  return <List className={classes.root}>{collectionItems}</List>
})

interface Props {
  collection: MusicItem[]
}

function CollectionList(props: Props) {
  const { collection } = props

  const dispatch: AppDispatch = useDispatch()
  const { playlists } = useSelector((state: RootState) => state.playlists)
  const [selectedPlaylistID, setSelectedPlaylistID] = React.useState<string | undefined>(undefined)
  const { showNotification } = React.useContext(NotificationsContext)

  const selectedPlaylist = playlists.find(playlist => playlist.id === selectedPlaylistID)

  const onTrackSelect = React.useCallback(
    (track: TrackModel) => {
      dispatch(playTrack(track)).then(() => showNotification("success", `Added '${track.title}' to queue`))
    },
    [dispatch, showNotification]
  )

  const onPlaylistSelect = React.useCallback((playlist: PlaylistModel) => {
    setSelectedPlaylistID(playlist.id)
  }, [])

  const PlaylistHeaderMemo = React.useMemo(() => {
    return selectedPlaylist ? (
      <PlaylistHeader
        onBack={() => setSelectedPlaylistID(undefined)}
        onEnqueueAll={() =>
          dispatch(playPlaylist(selectedPlaylist)).then(() =>
            showNotification("success", `Added all songs of '${selectedPlaylist.name}' to queue`)
          )
        }
        onRefresh={() =>
          dispatch(fetchPlaylistByID(selectedPlaylist._id, false)).then(() =>
            showNotification("success", `Refreshed '${selectedPlaylist.name}'`)
          )
        }
      />
    ) : (
      undefined
    )
  }, [dispatch, selectedPlaylist, showNotification])

  return (
    <>
      {PlaylistHeaderMemo}
      <MusicItemList
        items={selectedPlaylist ? selectedPlaylist.tracks : collection}
        onTrackSelect={onTrackSelect}
        onPlaylistSelect={onPlaylistSelect}
      />
    </>
  )
}

export default CollectionList

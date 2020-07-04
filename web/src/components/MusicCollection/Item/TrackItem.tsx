import Avatar from "@material-ui/core/Avatar"
import Link from "@material-ui/core/Link"
import ListItem from "@material-ui/core/ListItem"
import ListItemAvatar from "@material-ui/core/ListItemAvatar"
import ListItemText from "@material-ui/core/ListItemText"
import makeStyles from "@material-ui/styles/makeStyles"
import React, { useRef } from "react"
import { Draggable } from "react-beautiful-dnd"
import { useDispatch } from "react-redux"
import { AppDispatch } from "../../../app/store"
import { updateTrack } from "../../../redux/tracksSlice"
import { SpotifyHelper } from "../../../shared/utils/helpers"
import { DeleteButton, FavorButton } from "./Buttons"

const useStyles = makeStyles(theme => ({
  queueItem: {
    boxShadow: "1",
    position: "relative",
    padding: 0
  },
  avatar: {
    minHeight: "64px",
    minWidth: "64px"
  },
  text: {
    padding: "0px 24px"
  }
}))

interface TrackItemProps {
  current?: boolean
  track: TrackModel
  onClick?: () => void
  onDeleteClick?: () => void
  showFavourite?: boolean
}

export const TrackItem = React.forwardRef(function TrackItem(props: TrackItemProps, ref: React.Ref<HTMLDivElement>) {
  const { current, track, onClick, onDeleteClick, showFavourite } = props
  const classes = useStyles()

  const dispatch: AppDispatch = useDispatch()

  const toggleFavourite = React.useCallback(() => {
    dispatch(updateTrack({ ...track, favourite: !track.favourite }))
  }, [dispatch, track])

  const primaryText = SpotifyHelper.isSpotifyTrack(track) ? `${track.title} - ${track.artists}` : track.title

  return (
    <ListItem button className={classes.queueItem} onClick={onClick} ref={ref} selected={current}>
      <ListItemAvatar>
        <Avatar
          alt="thumbnail"
          className={classes.avatar}
          src={track.thumbnail?.small ?? track.thumbnail?.medium ?? track.thumbnail?.large}
          variant="square"
        />
      </ListItemAvatar>
      <ListItemText
        className={classes.text}
        primaryTypographyProps={{
          style: {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
          }
        }}
        secondaryTypographyProps={{
          style: {
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis"
          }
        }}
        primary={primaryText}
        secondary={
          track.url && (
            <Link href={track.url} color="inherit" target="_blank" rel="noreferrer">
              {track.url}
            </Link>
          )
        }
      />
      {onDeleteClick ? <DeleteButton onClick={onDeleteClick} /> : undefined}
      {showFavourite ? <FavorButton onClick={toggleFavourite} favourite={track.favourite || false} /> : undefined}
    </ListItem>
  )
})

interface DraggableTrackItemProps extends TrackItemProps {
  id: string
  index: number
  old?: boolean
}

export function DraggableTrackItem(props: DraggableTrackItemProps) {
  const { current, id, index } = props

  const myRef = useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    if (current) {
      setTimeout(() => {
        myRef.current && myRef.current.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 500)
    }
  }, [current])

  return (
    <Draggable draggableId={id} key={id} index={index}>
      {provided => (
        <div ref={provided.innerRef} {...provided.dragHandleProps} {...provided.draggableProps}>
          <TrackItem {...props} ref={myRef} />
        </div>
      )}
    </Draggable>
  )
}

import React from 'react'
import memoize from 'memoize-one'
import Measure from 'react-measure'
import Icon from '@mdi/react'
import { FixedSizeList as List } from 'react-window'

import Checkbox from '@/components/common/checkbox'
import RowRenderer from './internal/row'
import HeaderColumn from './internal/headerColumn'
import * as SortDirection from '@/constants/sortDirection'
import { HASH as iconHash, CLOCK as iconClock } from '@/constants/icons'

const ROW_HEIGHT = 50

// Memoized data
const createItemData = memoize((
  // State
  items,
  cache,
  paused,
  downloads,
  favorites,
  currentTrack,
  selectedItems,
  // Actions
  attempPlay,
  doNavigate,
  togglePlay,
  toggleFavorite,
  handleItemChecked
) => ({
  // State
  items,
  cache,
  paused,
  downloads,
  favorites,
  currentTrack,
  selectedItems,
  // Actions
  attempPlay,
  doNavigate,
  togglePlay,
  toggleFavorite,
  handleItemChecked,
}))

class TrackList extends React.PureComponent {
  static defaultProps = {
    // Playlist
    type: 'playlist',
    tracks: [],
    playlist: null,
    // Measure
    dimensions: { width: 0, height: 0 },
  }

  constructor(props) {
    super(props)
    const { tracks } = this.props
    this.state = {
      // Sort
      sortBy: null,
      sortDirection: null,
      // Edit
      selectedItems: null,
      editModeActive: false,
      allItemsSelected: false,
      // Scroll
      currentIndex: 0,
    }
  }

  handleResize = contentRect => {
    console.info(contentRect.bounds)
    this.setState({ dimensions: contentRect.bounds })
  }

  handleItemChecked = (item, checked) => {
    this.setState(prevState => {
      // Previous state
      let selectedItems = { ...prevState.selectedItems }
      // Add item
      if (checked) {
        selectedItems[item] = item
      }
      // Remove item
      if (!checked && selectedItems[item]) {
        delete selectedItems[item]
        // Empty list
        if (Object.keys(selectedItems).length === 0) {
          selectedItems = null
        }
      }
      // Update items list
      return { selectedItems }
    })
  }

  handleAllItemsChecked = event => {
    const { tracks } = this.props
    const { checked } = event.target

    this.setState(prevState => {
      // Clear all items
      let selectedItems = null
      // Add All items
      if (checked) {
        selectedItems = {}
        tracks.map(item => {
          selectedItems[item] = item
        })
      }
      // Update items list
      return { selectedItems, allItemsSelected: checked }
    })
  }

  handleSort = sortBy => {
    let sortDirection
    this.setState(prevState => {
      if (prevState.sortBy !== sortBy) {
        // Ascending order
        sortDirection = SortDirection.ASC
      } else if (prevState.sortDirection == SortDirection.ASC) {
        // Descending order
        sortDirection = SortDirection.DESC
      } else if (prevState.sortDirection == SortDirection.DESC) {
        // Natural sort order
        return { sortBy: null, sortDirection: null }
      }
      // Update state
      return { sortBy, sortDirection }
    })
  }

  componentDidUpdate(prevProps, prevState) {
    const { tracks } = this.props
    const { selectedItems, editModeActive } = this.state
    // Enable edit mode
    if (!editModeActive && selectedItems) {
      this.setState({ editModeActive: true })
    }
    // Disable edit mode
    if (editModeActive && !selectedItems) {
      this.setState({ editModeActive: false })
    }
    // Update selected items list
    if (editModeActive && selectedItems && prevProps.tracks.length !== tracks.length) {
      let removedItems = 0
      let nextSelectedItems = { ...selectedItems }
      const selectedItemsList = Object.keys(selectedItems)
      // Chedck for removed items
      selectedItemsList.map((item, index) => {
        // Item was removed from list
        if (tracks.indexOf(item) === -1) {
          delete nextSelectedItems[item]
          removedItems++
        }
      })
      // List is empty
      if (removedItems === selectedItemsList.length) {
        nextSelectedItems = null
      }
      // List needs to be update
      if (removedItems > 0) {
        // Update selected items
        this.setState({ selectedItems: nextSelectedItems })
      }
    }
  }

  render() {
    // state
    const {
      dimensions,
      selectedItems,
      allItemsSelected,
      sortBy,
      sortDirection,
      editModeActive,
    } = this.state
    // props
    const { cache, tracks, paused, downloads, favorites, currentTrack } = this.props
    // actions
    const { attempPlay, doNavigate, togglePlay, toggleFavorite } = this.props

    // Memoized props
    const data = createItemData(
      // State
      tracks,
      cache,
      paused,
      downloads,
      favorites,
      currentTrack,
      selectedItems,
      // Actions
      attempPlay,
      doNavigate,
      togglePlay,
      toggleFavorite,
      this.handleItemChecked
    )

    // Header columns
    const columns = [
      {
        dataKey: 'index',
        width: '32px',
        isAction: true,
        disabledSort: true,
        cellRender: <Icon className="icon link__icon" path={iconHash} />,
      },
      {
        dataKey: 'favorite',
        width: '32px',
        isAction: true,
        cellRender: null,
        disabledSort: true,
      },
      {
        dataKey: 'title',
        width: '300px',
        cellRender: 'Title',
      },
      {
        dataKey: 'artist',
        width: '124px',
        cellRender: 'Artist',
      },
      {
        dataKey: 'price',
        width: '80px',
        cellRender: 'Price',
      },
      {
        dataKey: 'duration',
        width: '64px',
        cellRender: <Icon className="icon link__icon" path={iconClock} />,
      },
    ]

    const editColumnProps = {
      dataKey: 'selected',
      width: '32px',
      isAction: true,
      disabledSort: true,
      cellRender: (
        <Checkbox
          name={'checkbox'}
          checked={allItemsSelected}
          onChange={this.handleAllItemsChecked}
        />
      ),
    }

    const formatedItemsCount = count => {
      if (tracks.length === count) return 'All tracks selected'
      if (count === 1) return '1 track selected'
      return `${count} tracks selected`
    }

    const editOptions = (
      <div className={'Row--header__edit-bar'}>
        <span>
          {selectedItems && formatedItemsCount(Object.keys(selectedItems).length)}
        </span>
      </div>
    )

    // Dimensions
    const { width, height } = dimensions || {}

    return (
      <Measure bounds={true} onResize={this.handleResize}>
        {({ measureRef }) => (
          <div className={'Table'}>
            <div className={'Row Row--header'} style={{ height: ROW_HEIGHT }}>
              {!editModeActive &&
                columns.map(columnProps => (
                  <HeaderColumn
                    key={columnProps.dataKey}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={this.handleSort}
                    {...columnProps}
                  />
                ))}
              {editModeActive && editOptions}
              <HeaderColumn
                sortBy={sortBy}
                sortDirection={sortDirection}
                onSort={this.handleSort}
                {...editColumnProps}
              />
            </div>
            <div
              ref={measureRef}
              className={'Rows-container'}
              style={{ top: ROW_HEIGHT }}
            >
              <List
                width={width || 0}
                height={height || 0}
                itemSize={ROW_HEIGHT}
                itemData={data}
                itemCount={tracks.length}
                className={'Rows'}
              >
                {RowRenderer}
              </List>
            </div>
          </div>
        )}
      </Measure>
    )
  }
}

export default TrackList

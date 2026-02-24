'use client'

// React Imports
import { useRef, useState, useEffect } from 'react'

// MUI Imports
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Popper from '@mui/material/Popper'
import Fade from '@mui/material/Fade'
import Paper from '@mui/material/Paper'
import ClickAwayListener from '@mui/material/ClickAwayListener'
import MenuList from '@mui/material/MenuList'
import MenuItem from '@mui/material/MenuItem'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'

const ModeDropdown = () => {
  // States
  const [open, setOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Refs
  const anchorRef = useRef(null)
  const iconRef = useRef(null)

  // Hooks
  const { settings, updateSettings } = useSettings()

  const handleClose = () => {
    setOpen(false)
    setTooltipOpen(false)
  }

  const handleToggle = () => {
    setOpen(prevOpen => !prevOpen)
  }

  const handleModeSwitch = mode => {
    handleClose()

    if (settings.mode !== mode) {
      updateSettings({ mode: mode })
    }
  }

  const getModeIcon = () => {
    if (settings.mode === 'system') {
      return 'tabler-device-laptop'
    } else if (settings.mode === 'dark') {
      return 'tabler-moon-stars'
    } else {
      return 'tabler-sun'
    }
  }

  // Ensure mounted flag is set on client after first paint so we can
  // render a deterministic placeholder during SSR/initial render to avoid
  // hydration mismatches when settings are read from cookies/localStorage.
  useEffect(() => {
    setMounted(true)
  }, [])

  // After mount, update the icon element to match the current settings.
  useEffect(() => {
    if (!iconRef.current) return
    try {
      const cls = getModeIcon()
      iconRef.current.className = cls
    } catch (e) {
      // ignore
    }
    // only run on mount and when settings.mode changes
  }, [settings.mode])

  return (
    <>
      {mounted ? (
        <Tooltip
          title={settings.mode + ' Mode'}
          onOpen={() => setTooltipOpen(true)}
          onClose={() => setTooltipOpen(false)}
          open={open ? false : tooltipOpen ? true : false}
          slotProps={{ popper: { className: 'capitalize' } }}
        >
          <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary'>
            <i ref={iconRef} className='tabler-device-laptop' />
          </IconButton>
        </Tooltip>
      ) : (
        // Render a deterministic placeholder icon on the first (server/client) render
        // to ensure the server HTML matches the client's initial HTML and avoid
        // hydration mismatch. The real icon will be set after mount via effect.
        <IconButton ref={anchorRef} onClick={handleToggle} className='text-textPrimary' aria-hidden>
          <i ref={iconRef} className='tabler-device-laptop' />
        </IconButton>
      )}
      <Popper
        open={open}
        transition
        disablePortal
        placement='bottom-start'
        anchorEl={anchorRef.current}
        className='min-is-[160px] !mbs-3 z-[1]'
      >
        {({ TransitionProps, placement }) => (
          <Fade
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom-start' ? 'left top' : 'right top' }}
          >
            <Paper className={settings.skin === 'bordered' ? 'border shadow-none' : 'shadow-lg'}>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList onKeyDown={handleClose}>
                  <MenuItem
                    className='gap-3'
                    onClick={() => handleModeSwitch('light')}
                    selected={settings.mode === 'light'}
                  >
                    <i className='tabler-sun' />
                    Light
                  </MenuItem>
                  <MenuItem
                    className='gap-3'
                    onClick={() => handleModeSwitch('dark')}
                    selected={settings.mode === 'dark'}
                  >
                    <i className='tabler-moon-stars' />
                    Dark
                  </MenuItem>
                  <MenuItem
                    className='gap-3'
                    onClick={() => handleModeSwitch('system')}
                    selected={settings.mode === 'system'}
                  >
                    <i className='tabler-device-laptop' />
                    System
                  </MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  )
}

export default ModeDropdown

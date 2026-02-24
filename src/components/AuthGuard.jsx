'use client'

import PropTypes from 'prop-types'

const AuthGuard = ({ children }) => {
  // AuthGuard no longer forces redirects to a login page.
  // It simply renders its children so pages remain accessible.
  return <>{children}</>
}

AuthGuard.propTypes = {
  children: PropTypes.node
}

export default AuthGuard

/**
 * Role gate. Usage: router.get('/x', authRequired, requireRole('DistrictAdmin', 'SuperAdmin'), handler)
 */
export function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role' });
    }
    return next();
  };
}

export default requireRole;

module.exports = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient role" });
    }

    return next();
  };
};

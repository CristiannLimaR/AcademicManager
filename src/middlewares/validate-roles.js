export const hasRole = (...roles)=>{
    return (req, res, next)=>{
        if (!req.user) {
            return res.status(500).json({
                success: false,
                msg: 'You want to verify a role without validating the token first'
            })
        }
        if (!roles.includes(req.user.role)) {
            return res.status(401).json({
                success: false,
                msg: `Unauthorized user, has a role ${req.user.role}, authorized roles are ${roles}`
            })
        }
 
        next();
    }
}
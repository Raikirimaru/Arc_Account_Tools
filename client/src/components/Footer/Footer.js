import React, { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import FabButton from '../Fab/Fab'
import styles from './Footer.module.css'

const Footer = () => {
    const location = useLocation()
    const [user, setUser ] = useState(JSON.parse(localStorage.getItem('profile')))

    useEffect(() => {
        setUser(JSON.parse(localStorage.getItem('profile')))
    }, [location])

    return (
        <footer>
            <div className={styles.footerText}>
            ©AMEVOR Mawuli Godwin A.  | Made with ♥ in 🇳🇬 <span><a href="https://github.com/Raikirimaru/Arc_Account_Tools" target="_blank" rel="noopener noreferrer">[Download source code]</a></span>
            </div>
            {user && (
            <FabButton />
            )}
        </footer>
    )
}

export default Footer

import { Link, useLocation } from 'react-router-dom';
import { Backpack, LayoutDashboard, Navigation, Shirt } from 'lucide-react';
import './NavigationBar.css';


const NavigationBar = () => {
    const location = useLocation();

    const links = [
        { to: '/', label: 'Dashboard', Icon: LayoutDashboard },
        { to: '/trip-manager', label: 'Plan Trip', Icon: Navigation },
        { to: '/laundry-tracker', label: 'Laundry Tracker', Icon: Shirt },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                {/* Brand */}
                <Link to="/" className="navbar-brand">
                    <Backpack size={20} />
                    <span>Home Trip Mode</span>
                </Link>

                {/* Links */}
                <div className="navbar-links">
                    {links.map(({ to, label, Icon }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`navbar-link ${location.pathname === to ? 'active' : ''}`}
                        >
                            <Icon size={15} />
                            {label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default NavigationBar;
import CaseDetail from './pages/CaseDetail';
import LenderDashboard from './pages/LenderDashboard';
import Lenders from './pages/Lenders';
import NewCase from './pages/NewCase';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Dashboard from './pages/Dashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CaseDetail": CaseDetail,
    "LenderDashboard": LenderDashboard,
    "Lenders": Lenders,
    "NewCase": NewCase,
    "Reports": Reports,
    "Settings": Settings,
    "Dashboard": Dashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
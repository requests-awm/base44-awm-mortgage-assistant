import CaseDetail from './pages/CaseDetail';
import Dashboard from './pages/Dashboard';
import LenderDashboard from './pages/LenderDashboard';
import Lenders from './pages/Lenders';
import NewCase from './pages/NewCase';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CaseDetail": CaseDetail,
    "Dashboard": Dashboard,
    "LenderDashboard": LenderDashboard,
    "Lenders": Lenders,
    "NewCase": NewCase,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
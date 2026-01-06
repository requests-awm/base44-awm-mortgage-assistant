import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import CaseDetail from './pages/CaseDetail';
import Lenders from './pages/Lenders';
import Settings from './pages/Settings';
import LenderDashboard from './pages/LenderDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NewCase": NewCase,
    "CaseDetail": CaseDetail,
    "Lenders": Lenders,
    "Settings": Settings,
    "LenderDashboard": LenderDashboard,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
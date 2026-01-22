import CaseCreated from './pages/CaseCreated';
import Dashboard from './pages/Dashboard';
import LenderDashboard from './pages/LenderDashboard';
import Lenders from './pages/Lenders';
import NewCase from './pages/NewCase';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CaseDetail from './pages/CaseDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CaseCreated": CaseCreated,
    "Dashboard": Dashboard,
    "LenderDashboard": LenderDashboard,
    "Lenders": Lenders,
    "NewCase": NewCase,
    "Reports": Reports,
    "Settings": Settings,
    "CaseDetail": CaseDetail,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
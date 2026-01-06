import Dashboard from './pages/Dashboard';
import NewCase from './pages/NewCase';
import CaseDetail from './pages/CaseDetail';
import Lenders from './pages/Lenders';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "NewCase": NewCase,
    "CaseDetail": CaseDetail,
    "Lenders": Lenders,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
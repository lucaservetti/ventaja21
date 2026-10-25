import { createContext, useContext } from "react";

const NavContext = createContext(null);
const useNav = () => useContext(NavContext);
export { NavContext, useNav };
